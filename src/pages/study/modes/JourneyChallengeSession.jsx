import { useState, useRef, useEffect } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import JourneyChallengeSetupModal from '@/components/study/quiz/JourneyChallengeSetupModal';
import JourneyChallengeSummary from '@/components/study/quiz/JourneyChallengeSummary';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { generateJourneyChallenge } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useSessions } from '@/hooks/queries/useSessions';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import {
  computePerModuleAccuracy,
  computePerModuleMissedConcept,
} from '@/utils/study/challengeAnalysis';
import {
  getPreviousChallengeSession,
  computeChallengeDeltas,
} from '@/utils/study/challengeHistory';
import { applyChallengePlanBoost } from '@/utils/study/applyChallengePlanBoost';

function initialPhase(session) {
  if (session.status === 'completed' && session.sessionData?.answers?.length) return 'summary';
  if (session.sessionData?.questions?.length) return 'active';
  if (session.sessionData?.challengeConfig) return 'loading';
  return 'setup';
}

export default function JourneyChallengeSession({ session, activity, journeyId, modules = [] }) {
  const { data: journey } = useJourney(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const autoStartedRef = useRef(false);

  const [phase, setPhase] = useState(() => initialPhase(session));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [config, setConfig] = useState(() => session.sessionData?.challengeConfig ?? null);
  const [loading, setLoading] = useState(
    () => !!session.sessionData?.challengeConfig && !session.sessionData?.questions?.length,
  );
  const [genError, setGenError] = useState(null);
  const [summaryState, setSummaryState] = useState(() => (
    session.status === 'completed' && session.sessionData?.answers
      ? session.sessionData
      : null
  ));

  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const returnPath = `/journeys/${journeyId}`;

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const startGeneration = async (challengeConfig) => {
    setLoading(true);
    setGenError(null);
    setConfig(challengeConfig);
    try {
      const { questionCount, focusWeight, moduleTargets } = challengeConfig;
      const nextQuestions = await runStudyAiGeneration({
        generate: () => generateJourneyChallenge({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          questionCount,
          focusWeight,
          moduleTargets,
          moduleMaps: modules.map((m) => ({
            moduleId: m.moduleId,
            name: m.name,
            stage: m.stage,
            concepts: m.knowledgeMap?.concepts ?? [],
          })),
        }),
        normalize: (raw) => normalizeQuizQuestions(raw, questionCount, { moduleTargets }),
        validate: (list) => requireGeneratedQuestions(list, questionCount, 'questions'),
        persist: async (list) => {
          await updateSession.mutateAsync({
            sessionId: session.sessionId,
            journeyId,
            patch: {
              sessionData: {
                challengeConfig,
                questions: list,
                aiGeneration: { status: 'ready', completedAt: Date.now() },
              },
            },
          });
        },
      });

      setQuestions(nextQuestions);
      setPhase('active');
    } catch (err) {
      setGenError(err?.message || 'Failed to start challenge');
      setPhase('setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      phase === 'loading'
      && config
      && !questions.length
      && !loading
      && !genError
      && !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      startGeneration(config);
    }
  }, [phase, config, questions.length, loading, genError]);

  const handleComplete = async (answers, totalTimeSec, meta) => {
    const challengeConfig = config ?? session.sessionData?.challengeConfig;
    const strictTotal = challengeConfig
      ? challengeConfig.questionCount * challengeConfig.strictSecondsPerQuestion
      : null;
    const timeRemainingSec = strictTotal != null
      ? Math.max(0, strictTotal - (totalTimeSec ?? 0))
      : null;

    const perModuleAccuracy = computePerModuleAccuracy(questions, answers);
    const perModuleMissedConcept = computePerModuleMissedConcept(questions, answers, modules);
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    const planResult = await applyChallengePlanBoost(journeyId, modules, perModuleAccuracy);
    const previous = getPreviousChallengeSession(sessions, session.sessionId);
    const challengeDeltas = computeChallengeDeltas(modules, perModuleAccuracy, previous);

    const sessionData = {
      challengeConfig,
      questions,
      answers,
      flaggedIndices: meta?.flaggedIndices ?? [],
      perModuleAccuracy,
      perModuleMissedConcept,
      planReweighted: planResult.reweighted,
      focusModules: planResult.focusModules,
      totalTimeSec,
      timeRemainingSec,
      overallReadinessSignal: accuracy >= 80 ? 'examReady' : accuracy >= 55 ? 'nearlyReady' : 'notReady',
    };

    setSummaryState({
      ...sessionData,
      challengeDeltas,
      focusModules: planResult.focusModules,
    });
    setPhase('summary');

    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, perModuleAccuracy },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary' && summaryState) {
    return (
      <JourneyChallengeSummary
        questions={summaryState.questions ?? questions}
        answers={summaryState.answers ?? []}
        modules={modules}
        perModuleAccuracy={summaryState.perModuleAccuracy ?? {}}
        perModuleMissedConcept={summaryState.perModuleMissedConcept ?? {}}
        totalTimeSec={summaryState.totalTimeSec}
        timeRemainingSec={summaryState.timeRemainingSec}
        challengeDeltas={summaryState.challengeDeltas ?? []}
        planReweighted={summaryState.planReweighted}
        focusModules={summaryState.focusModules ?? []}
        returnHref={returnPath}
      />
    );
  }

  if (genError && (phase === 'setup' || phase === 'loading')) {
    return (
      <StudyChrome title="Journey Challenge" onExit={handleExit}>
        <StudyAiError message={genError} onRetry={() => config && startGeneration(config)} onExit={handleExit} />
      </StudyChrome>
    );
  }

  if (loading || (phase === 'loading' && !questions.length)) {
    return (
      <StudyChrome title="Journey Challenge" onExit={handleExit}>
        <AiGenerationLoading
          action="generateJourneyChallenge"
          className="study-mode-view"
        />
      </StudyChrome>
    );
  }

  if (phase === 'setup') {
    return (
      <>
        <StudyChrome title="Journey Challenge" onExit={handleExit}>
          <p className="study-setup-hint">Configure your challenge, then start when ready.</p>
        </StudyChrome>
        <JourneyChallengeSetupModal
          open
          modules={modules}
          activities={activities}
          journey={journey}
          onClose={handleExit}
          loading={loading}
          onStart={(challengeConfig) => {
            setPhase('loading');
            startGeneration(challengeConfig);
          }}
        />
      </>
    );
  }

  const runnerConfig = {
    strictMode: true,
    strictTimedMode: true,
    strictSecondsPerQuestion: config?.strictSecondsPerQuestion ?? 60,
    instantFeedback: false,
  };

  return (
    <StudyChrome title="Journey Challenge" onExit={handleExit}>
      {phase === 'active' && questions.length > 0 && (
        <QuizRunner
          questions={questions}
          config={runnerConfig}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )}
    </StudyChrome>
  );
}
