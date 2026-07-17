import { useState, useEffect, useRef, useCallback } from 'react';
import QuizSetupModal from '@/components/study/quiz/QuizSetupModal';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import ApClassroomQuizRunner from '@/components/study/quiz/ap-classroom/ApClassroomQuizRunner';
import QuizSummary from '@/components/study/quiz/QuizSummary';
import QuizContentSourceBadge from '@/components/study/quiz/QuizContentSourceBadge';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import { generateConceptRefresher } from '@/api/ai/study';
import { generatePracticeQuestionsBatched } from '@/utils/study/generatePracticeQuestionsProgressive';
import { focusGuidanceForPreset } from '@/api/ai/prompts/practiceQuiz';
import { getWeakConceptIds } from '@/utils/study/conceptWeakness';
import {
  buildQuizAvoidList,
  mergeQuizRegistry,
  underrepresentedConceptIds,
} from '@/utils/study/quizDedup';
import { normalizeQuizQuestions } from '@/utils/quiz/normalizeQuizQuestions';
import {
  validateGeneratedQuestions,
  collectRejectedStemPreviews,
} from '@/utils/quiz/validateGeneratedQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { selectQuestionsFromBank, shouldUseQuestionBank } from '@/utils/study/sampleQuestionBank';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useSessions } from '@/hooks/queries/useSessions';
import { useActivities } from '@/hooks/queries/useActivities';
import PreQuizConfidenceStep from '@/components/research/PreQuizConfidenceStep';
import { usePreQuizConfidence } from '@/hooks/research/usePreQuizConfidence';
import { quizPhaseAfterQuestions, withConfidenceSlider } from '@/utils/research/sessionConfidence';
import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { buildQuizCompositionPlan } from '@/utils/quiz/buildQuizCompositionPlan';
import { compositionNeedsClassicRunner } from '@/utils/quiz/questionTypes';
import { formatSessionInsight } from '@/utils/failures/formatFailureCopy';
import {
  aggregateQuizConceptResults,
  weakConceptIdsFromResults,
  strongConceptIdsFromResults,
} from '@/utils/study/aggregateQuizConceptResults';
import { buildSessionTrapDebrief } from '@/utils/study/buildSessionTrapDebrief';
import { resolvePostQuizNextActivity } from '@/utils/study/resolvePostQuizNextActivity';
import { useLaunchDueItem } from '@/hooks/home/useLaunchDueItem';
import { useScheduleNextSession } from '@/hooks/mutations/useStudyCommitmentMutations';

function initialPhase(session) {
  return quizPhaseAfterQuestions(session, 'setup');
}

function mergeUniqueByStem(a = [], b = []) {
  const out = [...a];
  const seen = new Set(a.map((q) => String(q.stem ?? q.prompt ?? '').toLowerCase().trim()));
  for (const q of b) {
    const key = String(q.stem ?? q.prompt ?? '').toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

export default function PracticeQuizSession({ session, activity, module, journeyId }) {
  const initialConfig = session.sessionData?.quizConfig;
  const { data: journey } = useJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: moduleActivities = [] } = useActivities(module?.moduleId);
  const launchDueItem = useLaunchDueItem();
  const scheduleNext = useScheduleNextSession();
  const [launchingNext, setLaunchingNext] = useState(false);
  const autoStartedRef = useRef(false);

  const [phase, setPhase] = useState(() => initialPhase(session));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [config, setConfig] = useState(() => {
    const plannerConfig = session.sessionData?.quizConfig;
    const base = plannerConfig ?? initialConfig ?? activity.content?.lastConfig ?? {};
    if (session.sessionData?.prescription?.spec?.timed || plannerConfig?.strictTimedMode) {
      return {
        ...base,
        strictTimedMode: true,
        timedMode: true,
        strictMode: true,
        instantFeedback: false,
      };
    }
    return base;
  });
  const [loading, setLoading] = useState(false);
  const [improvingQuality, setImprovingQuality] = useState(false);
  const [contentSource, setContentSource] = useState(
    () => session.sessionData?.aiGeneration?.source ?? null,
  );
  const [genError, setGenError] = useState(null);
  const [refresherContent, setRefresherContent] = useState(null);
  const [summaryData, setSummaryData] = useState(() => (
    session.status === 'completed' && session.sessionData?.answers
      ? {
        answers: session.sessionData.answers,
        totalTimeSec: session.durationSec ?? 0,
        failureInsight: null,
        failureModeId: null,
      }
      : null
  ));
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const updateActivity = useUpdateActivity();
  const [confidenceSlider, setConfidenceSlider] = useState(
    () => session.sessionData?.confidenceSlider ?? null,
  );
  const [apFallbackNotice, setApFallbackNotice] = useState(null);
  const { handleSubmit: submitConfidence, submitting: confidenceSubmitting } = usePreQuizConfidence({
    session,
    journeyId,
    onContinue: (slider) => {
      setConfidenceSlider(slider);
      setPhase('active');
    },
  });

  const concepts = module?.knowledgeMap?.concepts ?? [];
  const weakConceptIds = getWeakConceptIds(sessions, module?.moduleId);
  const bankAvailable = shouldUseQuestionBank(journey, activity);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath: '/home' });
  };

  const generateQuestions = useCallback(async (setupConfig, { onImproving } = {}) => {
    const plannerRx = session.sessionData?.prescription;
    const prescription = plannerRx?.spec
      ? {
        shouldApply: true,
        spec: plannerRx.spec,
        profile: computeFailureProfile(module),
        primaryMode: plannerRx.primaryMode,
        summary: plannerRx.summary,
      }
      : resolveModulePrescription(module);
    const effectiveSetup = { ...setupConfig, ...(session.sessionData?.quizConfig ?? {}) };
    const compositionPlan = buildQuizCompositionPlan({
      module,
      failureProfile: prescription.profile ?? computeFailureProfile(module),
      prescriptionSpec: prescription.shouldApply ? prescription.spec : null,
      setupConfig: effectiveSetup,
      concepts,
      quizRegistry: activity.content?.quizRegistry,
      sessions,
      journey,
      weakConceptIds,
    });

    let effectiveConfig = { ...effectiveSetup };
    if (prescription.shouldApply && prescription.spec?.timed) {
      effectiveConfig = {
        ...effectiveConfig,
        strictMode: true,
        strictTimedMode: true,
        timedMode: true,
        instantFeedback: false,
      };
    }

    if (setupConfig.uiPreset === 'apClassroom' && compositionNeedsClassicRunner(compositionPlan.slots)) {
      effectiveConfig = { ...effectiveConfig, uiPreset: 'classic' };
      setApFallbackNotice('This personalized quiz uses question types that need the classic interface.');
    } else {
      setApFallbackNotice(null);
    }

    const sessionMeta = {
      prescription: {
        prescriptionType: prescription.spec?.prescriptionType ?? null,
        primaryMode: prescription.primaryMode,
        summary: prescription.summary,
      },
      compositionPlan,
    };

    if (shouldUseQuestionBank(journey, activity)) {
      const bankQuestions = selectQuestionsFromBank(
        activity.content.questionBank,
        effectiveConfig,
        { weakConceptIds, compositionPlan },
      );
      requireGeneratedQuestions(bankQuestions, effectiveConfig.questionCount, 'questions');
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: {
          sessionData: {
            quizConfig: effectiveConfig,
            questions: bankQuestions,
            ...sessionMeta,
            aiGeneration: { status: 'ready', completedAt: Date.now(), source: 'questionBank' },
          },
        },
      });
      setContentSource('questionBank');
      return { questions: bankQuestions, config: effectiveConfig, source: 'questionBank' };
    }

    const { avoidQuestionIds, avoidStemPreviews, seen } = buildQuizAvoidList(
      activity,
      sessions,
      module?.moduleId,
    );

    let focusGuidance = focusGuidanceForPreset(effectiveConfig.focusPreset, { weakConceptIds });
    if (effectiveConfig.focusPreset === 'newMaterial') {
      const under = underrepresentedConceptIds(concepts, seen);
      if (under.length) {
        focusGuidance += ` Underrepresented concepts: ${under.join(', ')}.`;
      }
    }

    const bankStems = activity.content?.questionBank ?? [];
    const runGenerate = async (extraAvoidStems = [], reasonSuffix = '') => {
      const guidance = reasonSuffix
        ? `${focusGuidance} ${reasonSuffix}`
        : focusGuidance;
      return runStudyAiGeneration({
        action: 'generatePracticeQuestions',
        generate: () => generatePracticeQuestionsBatched({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          moduleName: module?.name,
          moduleDescription: module?.description,
          moduleStage: module?.stage ?? 'B',
          concepts,
          questionCount: effectiveConfig.questionCount,
          focusPreset: effectiveConfig.focusPreset,
          focusGuidance: guidance,
          weakConceptIds,
          avoidQuestionIds,
          avoidStemPreviews: [...avoidStemPreviews, ...extraAvoidStems],
          questionStyle: effectiveConfig.questionStyle ?? 'standard',
          compositionPlan,
          prescriptionSummary: prescription.summary,
        }),
        normalize: (raw) => normalizeQuizQuestions(raw, effectiveConfig.questionCount),
        validate: () => {},
        persist: async () => {},
      });
    };

    let firstBatch = await runGenerate();
    let validated = validateGeneratedQuestions(firstBatch, {
      expectedCount: effectiveConfig.questionCount,
      existingBank: bankStems,
    });
    let good = validated.questions;

    if (!validated.ok) {
      onImproving?.(true);
      const rejectStems = collectRejectedStemPreviews(validated.rejected);
      try {
        const retryBatch = await runGenerate(
          rejectStems,
          'Rewrite rejected thin/meta/duplicate stems with distinct distractors.',
        );
        const retryValidated = validateGeneratedQuestions(retryBatch, {
          expectedCount: effectiveConfig.questionCount,
          existingBank: bankStems,
        });
        good = mergeUniqueByStem(good, retryValidated.questions);
      } finally {
        onImproving?.(false);
      }
    }

    requireGeneratedQuestions(good, effectiveConfig.questionCount, 'questions');

    await updateSession.mutateAsync({
      sessionId: session.sessionId,
      journeyId,
      patch: {
        sessionData: {
          quizConfig: effectiveConfig,
          questions: good,
          ...sessionMeta,
          aiGeneration: { status: 'ready', completedAt: Date.now(), source: 'ai' },
        },
      },
    });
    setContentSource('ai');
    return { questions: good, config: effectiveConfig, source: 'ai' };
  }, [
    activity,
    concepts,
    journey,
    journey?.subject,
    journey?.title,
    module?.description,
    module?.moduleId,
    module?.name,
    module?.stage,
    sessions,
    session.sessionId,
    session.sessionData,
    updateSession,
    weakConceptIds,
    journeyId,
  ]);

  const handleStart = useCallback(async (setupConfig) => {
    const useBank = shouldUseQuestionBank(journey, activity);
    setGenError(null);
    setImprovingQuality(false);
    if (!useBank) {
      setLoading(true);
      setContentSource('generating');
    } else {
      setContentSource('questionBank');
    }
    try {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            quizConfig: setupConfig,
            aiGeneration: {
              status: 'generating',
              startedAt: Date.now(),
              source: useBank ? 'questionBank' : 'ai',
            },
          },
        },
      });

      const result = await generateQuestions(setupConfig, {
        onImproving: (v) => setImprovingQuality(v),
      });
      const nextQuestions = result?.questions ?? result;
      const nextConfig = result?.config ?? setupConfig;
      setQuestions(nextQuestions);
      setConfig(nextConfig);
      setContentSource(result?.source ?? (useBank ? 'questionBank' : 'ai'));
      setPhase(session.sessionData?.confidenceSlider?.submittedAt ? 'active' : 'confidence');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setGenError(new Error(
        message.includes('questions')
          ? 'We could not assemble a solid quiz set. Try again, or use a smaller question count.'
          : message || 'Could not prepare questions',
      ));
      setPhase('setup');
      setContentSource(null);
    } finally {
      setLoading(false);
      setImprovingQuality(false);
    }
  }, [activity, generateQuestions, journey, journeyId, session.sessionData, session.sessionId, updateSession]);

  useEffect(() => {
    const pendingConfig = session.sessionData?.quizConfig;
    if (!pendingConfig?.questionCount) return;
    if (session.sessionData?.questions?.length) return;
    if (autoStartedRef.current) return;

    autoStartedRef.current = true;
    handleStart(pendingConfig);
  }, [session.sessionId, session.sessionData?.quizConfig, session.sessionData?.questions?.length, handleStart]);

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

    const priorData = session.sessionData ?? {};
    const sessionData = withConfidenceSlider(
      {
        ...priorData,
        quizConfig: config,
        questions,
        answers,
        interventions: priorData.interventions ?? [],
        prescription: priorData.prescription,
        compositionPlan: priorData.compositionPlan,
        aiGeneration: priorData.aiGeneration,
      },
      { confidenceSlider: confidenceSlider ?? priorData.confidenceSlider },
    );

    const conceptResults = aggregateQuizConceptResults({
      questions,
      answers,
      concepts: module?.knowledgeMap?.concepts ?? [],
    });

    const completedLikeSession = {
      ...session,
      activityType: 'practiceQuiz',
      sessionData,
      endedAt: Date.now(),
      status: 'completed',
    };

    const trapDebrief = buildSessionTrapDebrief({
      session: completedLikeSession,
      activity,
      module,
    });

    const nextActivity = resolvePostQuizNextActivity({
      module,
      journeyId,
      activities: moduleActivities.length ? moduleActivities : [activity],
      conceptResults,
      accuracy,
      trapDebrief,
    });

    const profile = computeFailureProfile(module);
    const failureInsight = formatSessionInsight(profile);

    setSummaryData({
      answers,
      totalTimeSec,
      failureInsight,
      failureModeId: trapDebrief.primaryMode ?? profile?.primaryMode ?? null,
      conceptResults,
      trapDebrief,
      nextActivity,
    });
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
        weakConcepts: weakConceptIdsFromResults(conceptResults),
        strongConcepts: strongConceptIdsFromResults(conceptResults),
        nextAction: nextActivity?.reason,
        conceptResults,
        trapDebrief,
        nextActivity: nextActivity ?? undefined,
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

  const handleLaunchNext = async (nextActivity) => {
    if (!nextActivity?.activityId || !nextActivity?.journeyId) return;
    setLaunchingNext(true);
    try {
      await launchDueItem({
        ...nextActivity,
        journeyTitle: journey?.title,
        moduleName: module?.name,
        activityLabel: nextActivity.label,
      });
    } finally {
      setLaunchingNext(false);
    }
  };

  const handleScheduleNext = (nextActivity) => {
    if (!nextActivity?.activityId) return;
    scheduleNext.mutate({
      ...nextActivity,
      journeyId: nextActivity.journeyId ?? journeyId,
      moduleId: nextActivity.moduleId ?? module?.moduleId,
    });
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
        failureInsight={summaryData.failureInsight}
        failureModeId={summaryData.failureModeId}
        contentSource={contentSource}
        conceptResults={summaryData.conceptResults}
        trapDebrief={summaryData.trapDebrief}
        nextActivity={summaryData.nextActivity}
        onLaunchNext={handleLaunchNext}
        launchingNext={launchingNext}
        onScheduleNext={handleScheduleNext}
        schedulingNext={scheduleNext.isPending}
      />
    );
  }

  if ((loading || improvingQuality) && !questions.length) {
    return (
      <AiGenerationLoading
        action={improvingQuality ? 'improvePracticeQuestions' : 'generatePracticeQuestions'}
        className="study-mode-view guide-mode-view guide-mode-view--loading"
      />
    );
  }

  if (genError && phase === 'setup' && !loading) {
    return (
      <StudyAiError
        message={genError?.message || 'Failed to generate questions'}
        error={genError}
        onRetry={() => handleStart(config?.questionCount ? config : activity.content?.lastConfig ?? config)}
        onExit={handleExit}
      />
    );
  }

  const prescription = module ? resolveModulePrescription(module) : null;

  return (
    <>
      <QuizSetupModal
        open={phase === 'setup'}
        defaultConfig={config}
        onClose={handleExit}
        onStart={handleStart}
        loading={loading}
        prescriptionSummary={prescription?.shouldApply ? prescription.summary : null}
        bankAvailable={bankAvailable}
      />
      {apFallbackNotice && phase === 'active' && (
        <p className="quiz-ap-fallback-notice">{apFallbackNotice}</p>
      )}
      {phase === 'confidence' && questions.length > 0 && (
        <PreQuizConfidenceStep
          onSubmit={submitConfidence}
          onExit={handleExit}
          submitting={confidenceSubmitting}
        />
      )}
      {phase === 'active' && questions.length > 0 && (
        <>
          <div className="quiz-content-source-row">
            <QuizContentSourceBadge source={contentSource} />
          </div>
          {config.uiPreset === 'apClassroom' ? (
            <ApClassroomQuizRunner
              questions={questions}
              config={config}
              moduleName={module?.name}
              onComplete={handleComplete}
              onExit={handleExit}
            />
          ) : (
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
      )}
    </>
  );
}
