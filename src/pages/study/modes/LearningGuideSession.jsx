import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import VeridianLoading from '@/components/shared/VeridianLoading';
import LearningGuideViewer from '@/components/study/learning-guide/LearningGuideViewer';
import SessionSummary from '@/components/study/SessionSummary';
import { generateLearningGuide } from '@/api/ai/study';
import { sectionCountForConcepts } from '@/api/ai/prompts/learningGuide';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function LearningGuideSession({ session, activity, module, journeyId }) {
  const { data: journey } = useJourney(journeyId);
  const [content, setContent] = useState(activity.content ?? {});
  const [completedIds, setCompletedIds] = useState(content.progress?.completedSectionIds ?? []);
  const [loading, setLoading] = useState(
    !activity.content?.sections?.length
      && (activity.status === 'notGenerated'
        || activity.status === 'generating'
        || activity.status === 'failed'),
  );
  const [phase, setPhase] = useState('active');
  const generationStartedRef = useRef(false);
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateActivity = useUpdateActivity();

  const sections = content.sections ?? [];
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;
  const moduleId = module?.moduleId;

  useEffect(() => {
    if (activity.content?.sections?.length) {
      setContent(activity.content);
      setLoading(false);
    }
  }, [activity.content]);

  useEffect(() => {
    if (generationStartedRef.current) return;

    if (activity.content?.sections?.length) {
      setLoading(false);
      return undefined;
    }

    if (activity.status === 'ready' && activity.content?.sections?.length) {
      setLoading(false);
      return undefined;
    }

    if (activity.status !== 'notGenerated'
      && activity.status !== 'generating'
      && activity.status !== 'failed') {
      setLoading(false);
      return undefined;
    }

    if (!moduleId || !journey) return undefined;

    generationStartedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        if (activity.status !== 'generating') {
          await updateActivity.mutateAsync({
            activityId: activity.activityId,
            journeyId,
            moduleId,
            patch: { status: 'generating' },
            skipInvalidate: true,
          });
        }

        const concepts = module.knowledgeMap?.concepts ?? [];
        const payload = {
          moduleName: module.name,
          moduleDescription: module.description,
          concepts,
          subject: journey.subject ?? 'General',
          priorKnowledge: journey.priorKnowledge ?? 'some',
          sectionCount: sectionCountForConcepts(concepts),
        };

        const raw = await generateLearningGuide(payload);
        const normalized = normalizeGuideContent(raw);

        if (!normalized?.sections?.length) {
          throw new Error('AI returned an empty learning guide.');
        }

        if (cancelled) return;

        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId,
          patch: {
            status: 'ready',
            content: normalized,
            itemCount: normalized.sections.length,
          },
        });

        setContent(normalized);
      } catch (err) {
        if (cancelled) return;
        toast.error(err.message || 'Failed to generate learning guide');
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId,
          patch: { status: 'failed' },
        }).catch(() => {});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [
    activity.activityId,
    activity.content?.sections?.length,
    activity.status,
    journey,
    journeyId,
    module,
    moduleId,
    updateActivity,
  ]);

  const handleExit = () => {
    window.speechSynthesis?.cancel();
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleSectionComplete = async (sectionId) => {
    const next = [...new Set([...completedIds, sectionId])];
    setCompletedIds(next);
    const nextContent = { ...content, progress: { completedSectionIds: next } };
    setContent(nextContent);
    await updateActivity.mutateAsync({
      activityId: activity.activityId,
      journeyId,
      moduleId,
      patch: { content: nextContent },
    });
  };

  const handleFinish = ({ checkInResults = {}, completedSectionIds = completedIds }) => {
    const checkInEntries = Object.entries(checkInResults).map(([sectionId, result]) => ({
      sectionId,
      ...result,
    }));

    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData: {
        completedSectionIds,
        checkInResults: checkInEntries,
      },
      score: sections.length ? Math.round((completedSectionIds.length / sections.length) * 100) : 0,
      outcomeSummary: {
        itemsCompleted: completedSectionIds.length,
        nextAction: 'Begin Stage B practice',
      },
      startedAt: session.startedAt,
    });
  };

  if (loading) {
    return (
      <div className="study-mode-view guide-mode-view guide-mode-view--loading">
        <VeridianLoading fullPage />
        <p className="guide-generating-label">Generating your learning guide…</p>
      </div>
    );
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Learning Guide complete"
        stats={[{ label: 'Sections completed', value: completedIds.length }]}
        nextAction="You're ready to start Stage B practice."
        returnHref={returnPath}
      />
    );
  }

  if (!sections.length) {
    return (
      <div className="study-mode-view guide-mode-view">
        <div className="guide-empty">
          <p>This learning guide could not be loaded.</p>
          <button type="button" className="btn btn-primary" onClick={handleExit}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <LearningGuideViewer
      sections={sections}
      completedIds={completedIds}
      onSectionComplete={handleSectionComplete}
      onFinish={handleFinish}
      onExit={handleExit}
    />
  );
}
