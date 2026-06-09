import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import SessionSummary from '@/components/study/SessionSummary';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';

export default function LearningGuideSession({ session, activity, module, journeyId }) {
  const [content, setContent] = useState(activity.content ?? {});
  const [sectionIndex, setSectionIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState(content.progress?.completedSectionIds ?? []);
  const [loading, setLoading] = useState(
    !activity.content?.sections?.length
      && (activity.status === 'notGenerated' || activity.status === 'generating'),
  );
  const [speaking, setSpeaking] = useState(false);
  const [phase, setPhase] = useState('active');
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateActivity = useUpdateActivity();

  const sections = content.sections ?? [];
  const section = sections[sectionIndex];

  useEffect(() => {
    if (activity.status === 'ready' && (activity.content?.sections?.length || content.sections?.length)) {
      setLoading(false);
      return;
    }
    if (activity.status !== 'notGenerated' && activity.status !== 'generating') return;

    (async () => {
      try {
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'generating' },
        });
        // AI generation disabled — guides should be pre-seeded on the activity:
        // const result = await generateLearningGuide({ ... });
        toast.error('Learning guide not available. Open a module with a pre-loaded guide.');
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'failed' },
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load guide');
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'failed' },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSpeech = () => {
    if (!section?.narrationText) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(section.narrationText);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  const markComplete = async () => {
    if (!section) return;
    const next = [...new Set([...completedIds, section.sectionId])];
    setCompletedIds(next);
    await updateActivity.mutateAsync({
      activityId: activity.activityId,
      journeyId,
      moduleId: module?.moduleId,
      patch: { content: { ...content, progress: { completedSectionIds: next } } },
    });
    if (sectionIndex + 1 < sections.length) {
      setSectionIndex(sectionIndex + 1);
    }
  };

  const finishGuide = async () => {
    const sessionData = { completedSectionIds: completedIds, checkInResults: [] };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: sections.length ? Math.round((completedIds.length / sections.length) * 100) : 0,
      outcomeSummary: {
        itemsCompleted: completedIds.length,
        nextAction: 'Begin Stage B practice',
      },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  if (loading) {
    return <StudyChrome title="Learning Guide" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}><p className="journeys-status">Generating your guide…</p></StudyChrome>;
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Learning Guide session"
        stats={[{ label: 'Sections completed', value: completedIds.length }]}
        nextAction="You're ready to start Stage B practice."
        returnHref={returnPath}
      />
    );
  }

  return (
    <StudyChrome
      title="Learning Guide"
      progressText={`Section ${sectionIndex + 1} / ${sections.length}`}
      progressPct={sections.length ? ((sectionIndex + 1) / sections.length) * 100 : 0}
      onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}
    >
      <div className="study-guide-layout">
        <nav className="study-guide-nav">
          {sections.map((s, i) => (
            <button
              key={s.sectionId}
              type="button"
              className={`study-guide-nav-item${i === sectionIndex ? ' active' : ''}${completedIds.includes(s.sectionId) ? ' done' : ''}`}
              onClick={() => setSectionIndex(i)}
            >
              {s.title}
            </button>
          ))}
        </nav>
        {section && (
          <article className="study-guide-section">
            <h2>{section.title}</h2>
            <LatexRenderer text={section.explanation} />
            {section.workedExamples?.map((ex) => (
              <div key={ex.scenario} className="study-guide-example">
                <strong>{ex.scenario}</strong>
                <ol>{ex.steps.map((step) => <li key={step}><LatexRenderer text={step} /></li>)}</ol>
                <p><LatexRenderer text={ex.answer} /></p>
                <p className="study-guide-reasoning"><LatexRenderer text={ex.reasoning} /></p>
              </div>
            ))}
            {section.checkInQuestion && (
              <div className="study-guide-checkin">
                <p><LatexRenderer text={section.checkInQuestion.question} /></p>
              </div>
            )}
            {section.externalSearchSuggestions?.length > 0 && (
              <ul className="study-guide-links">
                {section.externalSearchSuggestions.map((q) => (
                  <li key={q}>
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer">{q}</a>
                  </li>
                ))}
              </ul>
            )}
            <div className="study-guide-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSpeech}>
                {speaking ? 'Pause narration' : 'Play narration'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={markComplete}>Mark complete</button>
              {sectionIndex + 1 >= sections.length && (
                <button type="button" className="btn btn-primary btn-sm" onClick={finishGuide}>Finish guide</button>
              )}
            </div>
          </article>
        )}
      </div>
    </StudyChrome>
  );
}
