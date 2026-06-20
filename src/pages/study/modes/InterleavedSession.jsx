import { useState } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import QuizSetupForm from '@/components/study/quiz/QuizSetupForm';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { generateInterleavedQuestions } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function InterleavedSession({ session, activity, journeyId, modules = [] }) {
  const { data: journey } = useJourney(journeyId);
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [selectedModuleIds, setSelectedModuleIds] = useState(modules.map((m) => m.moduleId));
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const returnPath = `/journeys/${journeyId}`;

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleStart = async (config) => {
    setLoading(true);
    setGenError(null);
    try {
      const selected = modules.filter((m) => selectedModuleIds.includes(m.moduleId));
      const nextQuestions = await runStudyAiGeneration({
        generate: () => generateInterleavedQuestions({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          questionCount: config.questionCount,
          moduleMaps: selected.map((m) => ({
            moduleId: m.moduleId,
            name: m.name,
            concepts: m.knowledgeMap?.concepts ?? [],
          })),
        }),
        normalize: (raw) => normalizeQuizQuestions(raw, config.questionCount),
        validate: (list) => requireGeneratedQuestions(list, config.questionCount, 'questions'),
        persist: async (list) => {
          await updateSession.mutateAsync({
            sessionId: session.sessionId,
            journeyId,
            patch: {
              sessionData: {
                selectedModuleIds,
                questions: list,
                quizConfig: config,
                aiGeneration: { status: 'ready', completedAt: Date.now() },
              },
            },
          });
        },
      });

      setQuestions(nextQuestions);
      setPhase('active');
    } catch (err) {
      setGenError(err?.message || 'Failed to load questions');
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

  if (loading && phase === 'setup') {
    return (
      <StudyChrome title="Interleaved Review" onExit={handleExit}>
        <AiGenerationLoading
          action="generateInterleavedQuestions"
          className="study-mode-view"
        />
      </StudyChrome>
    );
  }

  if (genError && phase === 'setup') {
    return (
      <StudyChrome title="Interleaved Review" onExit={handleExit}>
        <StudyAiError
          message={genError}
          onRetry={() => setGenError(null)}
          onExit={handleExit}
        />
      </StudyChrome>
    );
  }

  return (
    <StudyChrome title="Interleaved Review" onExit={handleExit}>
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
      {phase === 'active' && questions.length > 0 && (
        <QuizRunner questions={questions} onComplete={handleComplete} onExit={handleExit} />
      )}
    </StudyChrome>
  );
}
