import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizSetupForm from '@/components/study/quiz/QuizSetupForm';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generateInterleavedQuestions } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function InterleavedSession({ session, activity, journeyId, modules = [] }) {
  const { data: journey } = useJourney(journeyId);
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState(modules.map((m) => m.moduleId));
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}`;

  const handleStart = async (config) => {
    setLoading(true);
    try {
      const selected = modules.filter((m) => selectedModuleIds.includes(m.moduleId));
      const raw = await generateInterleavedQuestions({
        journeyTitle: journey?.title,
        subject: journey?.subject,
        questionCount: config.questionCount,
        moduleMaps: selected.map((m) => ({
          moduleId: m.moduleId,
          name: m.name,
          concepts: m.knowledgeMap?.concepts ?? [],
        })),
      });
      setQuestions(normalizeQuizQuestions(raw, config.questionCount));
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = {
      selectedModuleIds,
      questions,
      answers,
      perModuleAccuracy: {},
    };
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review modules that collapsed under mixing' },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary') {
    return <SessionSummary title="Interleaved Review complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Interleaved Review" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'setup' && (
        <>
          <fieldset className="study-setup-field">
            <legend>Modules to include</legend>
            {modules.map((m) => (
              <label key={m.moduleId} className="study-setup-check">
                <input
                  type="checkbox"
                  checked={selectedModuleIds.includes(m.moduleId)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedModuleIds([...selectedModuleIds, m.moduleId]);
                    else setSelectedModuleIds(selectedModuleIds.filter((id) => id !== m.moduleId));
                  }}
                />
                {m.name}
              </label>
            ))}
          </fieldset>
          <QuizSetupForm onStart={handleStart} loading={loading} />
        </>
      )}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
    </StudyChrome>
  );
}
