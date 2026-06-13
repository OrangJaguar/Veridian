import { useState, useMemo } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { StudyAiLoading, StudyAiError } from '@/components/study/StudyAiStatus';
import { generateCramSession } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { useStudyAiAutoGeneration } from '@/hooks/ai/useStudyAiGeneration';
import { getDueCards } from '@/utils/fsrs';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useSessions } from '@/hooks/queries/useSessions';
import { useJourney } from '@/hooks/queries/useJourneys';

const QUESTION_COUNT = 8;

export default function CramSession({ session, activity, journeyId, modules = [], cards = [] }) {
  const { data: journey } = useJourney(journeyId);
  const [phase, setPhase] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const { data: sessions = [] } = useSessions(journeyId);
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const returnPath = `/journeys/${journeyId}`;

  const weakConcepts = useMemo(
    () => modules.flatMap((m) => getWeakConceptIds(sessions, m.moduleId, 5)),
    [modules, sessions],
  );
  const overdueCount = getDueCards(cards).length;
  const canGenerate = Boolean(journey && modules.length);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const { isLoading, isError, error, retry } = useStudyAiAutoGeneration({
    action: 'generateCramSession',
    enabled: canGenerate,
    hasContent: false,
    beforeGenerate: async () => {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            aiGeneration: { status: 'generating', startedAt: Date.now() },
          },
        },
      });
    },
    generate: async () => generateCramSession({
      journeyTitle: journey.title,
      subject: journey.subject,
      questionCount: QUESTION_COUNT,
      weakConceptIds: weakConcepts,
      overdueCardCount: overdueCount,
      moduleNames: modules.map((m) => m.name),
      moduleMaps: modules.map((m) => ({
        moduleId: m.moduleId,
        name: m.name,
        concepts: m.knowledgeMap?.concepts ?? [],
      })),
    }),
    normalize: (raw) => normalizeQuizQuestions(raw, QUESTION_COUNT),
    validate: (nextQuestions) => {
      requireGeneratedQuestions(nextQuestions, QUESTION_COUNT, 'cram questions');
    },
    persist: async (nextQuestions) => {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            questions: nextQuestions,
            aiGeneration: { status: 'ready', completedAt: Date.now() },
          },
        },
      });
    },
    onSuccess: (nextQuestions) => {
      setQuestions(nextQuestions);
      setPhase('active');
    },
    onError: () => setPhase('error'),
  });

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / answers.length) * 100) : 0;
    const sessionData = {
      itemsCompleted: answers.length,
      questions,
      answers,
      weakConcepts,
      overdueCount,
    };
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review missed concepts tomorrow' },
      startedAt: session.startedAt,
    });
  };

  if (isLoading || phase === 'loading') {
    return (
      <StudyChrome title="Cram Mode" onExit={handleExit}>
        <StudyAiLoading label="Generating cram questions…" className="study-mode-view" />
      </StudyChrome>
    );
  }

  if (isError || phase === 'error') {
    return (
      <StudyChrome title="Cram Mode" onExit={handleExit}>
        <StudyAiError
          message={error?.message || 'Could not load cram questions.'}
          error={error}
          onRetry={retry}
          onExit={handleExit}
        />
      </StudyChrome>
    );
  }

  if (phase === 'summary') {
    return <SessionSummary title="Cram session complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Cram Mode" onExit={handleExit}>
      <QuizRunner questions={questions} onComplete={handleComplete} onExit={handleExit} />
    </StudyChrome>
  );
}
