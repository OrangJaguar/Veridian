import { useState, useRef, useEffect } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import CramRunner from '@/components/study/cram/CramRunner';
import CramSessionSetupModal from '@/components/study/cram/CramSessionSetupModal';
import CramSessionSummary from '@/components/study/cram/CramSessionSummary';
import { StudyAiLoading, StudyAiError } from '@/components/study/StudyAiStatus';
import { generateCramSession } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useSessions } from '@/hooks/queries/useSessions';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import { computeCramPoolSize } from '@/utils/study/computeCramPoolSize';
import {
  computePerModuleAccuracy,
  computeHardestConcept,
} from '@/utils/study/challengeAnalysis';
import { cramEligibleModules } from '@/utils/study/journeyUnlock';

function initialPhase(session) {
  if (session.status === 'completed' && session.sessionData?.answers?.length) return 'summary';
  if (session.sessionData?.questions?.length) return 'active';
  if (session.sessionData?.cramConfig) return 'loading';
  return 'setup';
}

export default function CramSession({
  session,
  activity,
  journeyId,
  modules = [],
}) {
  const { data: journey } = useJourney(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const launchStudy = useLaunchStudy();
  const autoStartedRef = useRef(false);

  const [phase, setPhase] = useState(() => initialPhase(session));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [config, setConfig] = useState(() => session.sessionData?.cramConfig ?? null);
  const [loading, setLoading] = useState(
    () => !!session.sessionData?.cramConfig && !session.sessionData?.questions?.length,
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

  const eligibleModules = cramEligibleModules(modules);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const startGeneration = async (cramConfig) => {
    setLoading(true);
    setGenError(null);
    setConfig(cramConfig);
    const questionCount = computeCramPoolSize(cramConfig.durationMin);
    const moduleMaps = eligibleModules.filter((m) =>
      cramConfig.selectedModuleIds.includes(m.moduleId),
    );

    const weakConceptIds = moduleMaps.flatMap((m) =>
      getWeakConceptIds(sessions, m.moduleId, 5),
    );

    try {
      const nextQuestions = await runStudyAiGeneration({
        generate: () => generateCramSession({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          questionCount,
          selectedModuleIds: cramConfig.selectedModuleIds,
          weakConceptIds,
          moduleMaps: moduleMaps.map((m) => ({
            moduleId: m.moduleId,
            name: m.name,
            concepts: m.knowledgeMap?.concepts ?? [],
          })),
        }),
        normalize: (raw) => normalizeQuizQuestions(raw, questionCount, {
          moduleTargets: moduleMaps.map((m) => ({
            moduleId: m.moduleId,
            count: Math.ceil(questionCount / moduleMaps.length),
          })),
        }),
        validate: (list) => requireGeneratedQuestions(
          list,
          Math.min(questionCount, Math.max(3, list.length)),
          'cram questions',
        ),
        persist: async (list) => {
          await updateSession.mutateAsync({
            sessionId: session.sessionId,
            journeyId,
            patch: {
              sessionData: {
                cramConfig,
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
      setGenError(err?.message || 'Failed to start cram session');
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

  const handleComplete = async (answers, totalTimeSec) => {
    const perModuleAccuracy = computePerModuleAccuracy(questions, answers);
    const hardestConceptTag = computeHardestConcept(questions, answers, modules);
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;

    const sessionData = {
      cramConfig: config,
      questions,
      answers,
      perModuleAccuracy,
      hardestConceptTag,
      itemsCompleted: answers.length,
      totalTimeSec,
    };

    setSummaryState(sessionData);
    setPhase('summary');

    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, itemsCompleted: answers.length },
      startedAt: session.startedAt,
    });
  };

  const handleGoAgain = () => {
    if (!activity || !config) return;
    launchStudy({
      journeyId,
      activity,
      moduleId: null,
      initialSessionData: { cramConfig: config },
    });
  };

  if (phase === 'summary' && summaryState) {
    return (
      <CramSessionSummary
        answers={summaryState.answers ?? []}
        modules={modules}
        selectedModuleIds={summaryState.cramConfig?.selectedModuleIds ?? []}
        perModuleAccuracy={summaryState.perModuleAccuracy ?? {}}
        hardestConceptTag={summaryState.hardestConceptTag}
        totalTimeSec={summaryState.totalTimeSec}
        returnHref={returnPath}
        onGoAgain={handleGoAgain}
      />
    );
  }

  if (genError && (phase === 'setup' || phase === 'loading')) {
    return (
      <StudyChrome title="Cram Session" onExit={handleExit}>
        <StudyAiError message={genError} onRetry={() => config && startGeneration(config)} onExit={handleExit} />
      </StudyChrome>
    );
  }

  if (loading || (phase === 'loading' && !questions.length)) {
    return (
      <StudyChrome title="Cram Session" onExit={handleExit}>
        <StudyAiLoading label="Generating cram questions…" className="study-mode-view" />
      </StudyChrome>
    );
  }

  if (phase === 'setup') {
    return (
      <>
        <StudyChrome title="Cram Session" onExit={handleExit}>
          <p className="study-setup-hint">Pick a time window and modules to cram.</p>
        </StudyChrome>
        <CramSessionSetupModal
          open
          modules={modules}
          activities={activities}
          journey={journey}
          onClose={handleExit}
          loading={loading}
          onStart={(cramConfig) => {
            setPhase('loading');
            startGeneration(cramConfig);
          }}
        />
      </>
    );
  }

  return (
    <StudyChrome title="Cram Session" onExit={handleExit}>
      {phase === 'active' && questions.length > 0 && config && (
        <CramRunner
          questions={questions}
          durationMin={config.durationMin}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      )}
    </StudyChrome>
  );
}
