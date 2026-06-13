import { useState } from 'react';
import { toast } from 'sonner';
import QuizSetupModal from '@/components/study/quiz/QuizSetupModal';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import QuizSummary from '@/components/study/quiz/QuizSummary';
import { generatePracticeQuestions, generateConceptRefresher } from '@/api/ai/study';
import { focusGuidanceForPreset } from '@/api/ai/prompts/practiceQuiz';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import {
  buildQuizAvoidList,
  mergeQuizRegistry,
  underrepresentedConceptIds,
} from '@/utils/study/quizDedup';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useSessions } from '@/hooks/queries/useSessions';

function initialPhase(session, initialConfig) {
  if (session.status === 'completed' && session.sessionData?.answers?.length) return 'summary';
  if (initialConfig) return 'active';
  return 'setup';
}

export default function PracticeQuizSession({ session, activity, module, journeyId }) {
  const initialConfig = session.sessionData?.quizConfig;
  const { data: journey } = useJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);

  const [phase, setPhase] = useState(() => initialPhase(session, initialConfig));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [config, setConfig] = useState(initialConfig ?? activity.content?.lastConfig ?? {});
  const [loading, setLoading] = useState(false);
  const [refresherContent, setRefresherContent] = useState(null);
  const [summaryData, setSummaryData] = useState(() => (
    session.status === 'completed' && session.sessionData?.answers
      ? {
        answers: session.sessionData.answers,
        totalTimeSec: session.durationSec ?? 0,
      }
      : null
  ));
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const updateActivity = useUpdateActivity();

  const concepts = module?.knowledgeMap?.concepts ?? [];
  const weakConceptIds = getWeakConceptIds(sessions, module?.moduleId);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath: '/home' });
  };

  const handleStart = async (setupConfig) => {
    setLoading(true);
    try {
      const { avoidQuestionIds, avoidStemPreviews, seen } = buildQuizAvoidList(
        activity,
        sessions,
        module?.moduleId,
      );

      let focusGuidance = focusGuidanceForPreset(setupConfig.focusPreset, { weakConceptIds });
      if (setupConfig.focusPreset === 'newMaterial') {
        const under = underrepresentedConceptIds(concepts, seen);
        if (under.length) {
          focusGuidance += ` Underrepresented concepts: ${under.join(', ')}.`;
        }
      }

      const raw = await generatePracticeQuestions({
        journeyTitle: journey?.title,
        subject: journey?.subject,
        moduleName: module?.name,
        moduleDescription: module?.description,
        moduleStage: module?.stage ?? 'B',
        concepts,
        questionCount: setupConfig.questionCount,
        focusPreset: setupConfig.focusPreset,
        focusGuidance,
        weakConceptIds,
        avoidQuestionIds,
        avoidStemPreviews,
      });

      const nextQuestions = normalizeQuizQuestions(raw, setupConfig.questionCount);
      if (nextQuestions.length < setupConfig.questionCount) {
        throw new Error(`Expected ${setupConfig.questionCount} questions but got ${nextQuestions.length}.`);
      }

      setQuestions(nextQuestions);
      setConfig(setupConfig);
      setPhase('active');

      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: {
          sessionData: {
            quizConfig: setupConfig,
            questions: nextQuestions,
          },
        },
      });
    } catch (err) {
      toast.error(err.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleIntervention = async (conceptId) => {
    const concept = concepts.find((c) => c.id === conceptId);
    try {
      const data = await generateConceptRefresher({
        conceptId,
        term: concept?.term,
        definition: concept?.definition,
        moduleName: module?.name,
      });
      setRefresherContent(data);
    } catch {
      setRefresherContent({
        recap: concept
          ? `${concept.term}: ${concept.definition}`
          : 'Review this concept in your learning guide.',
        example: '',
      });
    }
  };

  const handleComplete = (answers, totalTimeSec) => {
    const graded = answers.filter((a) => !a.skipped);
    const correct = graded.filter((a) => a.correct).length;
    const accuracy = graded.length ? Math.round((correct / graded.length) * 100) : 0;
    const sessionData = { quizConfig: config, questions, answers, interventions: [] };

    setSummaryData({ answers, totalTimeSec });
    setPhase('summary');

    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: {
        accuracy,
        itemsCompleted: answers.length,
        weakConcepts: answers.filter((a) => !a.correct).map((a) => a.conceptId).filter(Boolean),
        nextAction: accuracy >= 70 ? 'Try Stage C activities' : 'Run another Weak Spots quiz',
      },
      startedAt: session.startedAt,
    });

    if (questions.length) {
      const quizRegistry = mergeQuizRegistry(activity.content?.quizRegistry, questions);
      updateActivity.mutate({
        activityId: activity.activityId,
        journeyId,
        moduleId: module?.moduleId,
        patch: {
          content: {
            ...activity.content,
            quizRegistry,
            lastConfig: config,
          },
        },
      });
    }
  };

  if (phase === 'summary' && summaryData) {
    return (
      <QuizSummary
        questions={questions}
        answers={summaryData.answers}
        totalTimeSec={summaryData.totalTimeSec}
        journeyTitle={journey?.title}
        moduleTitle={module?.name}
        returnHref="/home"
      />
    );
  }

  return (
    <>
      <QuizSetupModal
        open={phase === 'setup'}
        defaultConfig={config}
        onClose={handleExit}
        onStart={handleStart}
        loading={loading}
      />
      {phase === 'active' && (
        <QuizRunner
          questions={questions}
          config={config}
          onComplete={handleComplete}
          onExit={handleExit}
          onIntervention={handleIntervention}
          refresherContent={refresherContent}
        />
      )}
    </>
  );
}
