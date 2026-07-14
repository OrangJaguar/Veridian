import { useState, useCallback } from 'react';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import PreQuizConfidenceStep from '@/components/research/PreQuizConfidenceStep';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import SessionSummary from '@/components/study/SessionSummary';
import { usePreQuizConfidence } from '@/hooks/research/usePreQuizConfidence';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useStudyAiAutoGeneration } from '@/hooks/ai/useStudyAiGeneration';
import { generateDiagnosticQuestions } from '@/api/ai/study';
import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';
import { applyModuleDiagnosticResults } from '@/api/entities/applyModuleDiagnosticResults';
import { normalizeDiagnosticQuestions } from '@/utils/study/normalizeDiagnosticQuestions';
import {
  computeDiagnosticPlacement,
  difficultyGuidanceForPriorKnowledge,
  DIAGNOSTIC_QUESTIONS_PER_MODULE,
} from '@/utils/study/diagnosticPlacement';
import { withConfidenceSlider, quizPhaseAfterQuestions } from '@/utils/research/sessionConfidence';
import { trackProductEvent } from '@/lib/analytics';

const BASELINE_CONFIG = {
  strictMode: false,
  instantFeedback: false,
  diagnosticMode: true,
};

export default function BaselineCheckSession({
  session,
  activity,
  module,
  journeyId,
  journey,
}) {
  const hasQuestions = Boolean(session.sessionData?.questions?.length);
  const [phase, setPhase] = useState(() => quizPhaseAfterQuestions(session, hasQuestions ? 'confidence' : 'loading'));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [confidenceSlider, setConfidenceSlider] = useState(
    () => session.sessionData?.confidenceSlider ?? null,
  );

  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const returnPath = `/journeys/${journeyId}/modules/${module.moduleId}`;

  const { handleSubmit: submitConfidence, submitting: confidenceSubmitting } = usePreQuizConfidence({
    session,
    journeyId,
    onContinue: (slider) => {
      setConfidenceSlider(slider);
      setPhase('active');
    },
  });

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const buildPayload = useCallback(() => ({
    title: journey?.title,
    subject: journey?.subject,
    priorKnowledge: journey?.priorKnowledge ?? 'some',
    difficultyGuidance: difficultyGuidanceForPriorKnowledge(journey?.priorKnowledge),
    questionsPerModule: DIAGNOSTIC_QUESTIONS_PER_MODULE,
    modules: [{
      moduleId: module.moduleId,
      name: module.name,
      description: module.description,
      concepts: module.knowledgeMap?.concepts ?? [],
    }],
  }), [journey?.priorKnowledge, journey?.subject, journey?.title, module]);

  const markSessionGenerating = useCallback(async () => {
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
  }, [journeyId, session.sessionData, session.sessionId, updateSession]);

  const { isLoading, isError, error, retry } = useStudyAiAutoGeneration({
    action: 'generateDiagnosticQuestions',
    enabled: Boolean(journey && module?.moduleId),
    hasContent: hasQuestions,
    beforeGenerate: markSessionGenerating,
    generate: () => invokeWithRetry(
      (signal) => generateDiagnosticQuestions(buildPayload(), { signal }),
      { maxAttempts: 2 },
    ),
    normalize: (raw) => normalizeDiagnosticQuestions(
      raw.questions ?? raw,
      [module],
      DIAGNOSTIC_QUESTIONS_PER_MODULE,
    ),
    validate: (nextQuestions) => {
      if (!nextQuestions.length) {
        throw new Error('AI returned no diagnostic questions. Try again.');
      }
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
      setPhase('confidence');
    },
    onError: async (err) => {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            aiGeneration: { status: 'failed', message: err.message, failedAt: Date.now() },
          },
        },
      }).catch(() => {});
    },
  });

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = answers.length
      ? Math.round((correct / answers.length) * 100)
      : 0;
    const placement = computeDiagnosticPlacement(questions, answers, [module]);
    const sessionData = withConfidenceSlider({
      questions,
      answers,
      placement,
    }, { confidenceSlider: confidenceSlider ?? session.sessionData?.confidenceSlider });

    await applyModuleDiagnosticResults(module, placement, session.sessionId);
    trackProductEvent('module_diagnostic_complete', {
      journeyId,
      moduleId: module.moduleId,
      accuracy,
    });

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
      activityType: 'baselineCheck',
    });
  };

  if (isLoading && !questions.length) {
    return (
      <AiGenerationLoading
        action="generateDiagnosticQuestions"
        className="study-mode-view"
      />
    );
  }

  if (isError && !questions.length) {
    return (
      <StudyAiError message={error?.message} error={error} onRetry={retry} onExit={handleExit} />
    );
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Starting point recorded"
        returnHref={returnPath}
      />
    );
  }

  if (phase === 'confidence' && questions.length) {
    return (
      <PreQuizConfidenceStep
        onSubmit={submitConfidence}
        onExit={handleExit}
        submitting={confidenceSubmitting}
        title="Starting Point Check"
      />
    );
  }

  if (phase === 'active' && questions.length) {
    return (
      <QuizRunner
        questions={questions}
        config={BASELINE_CONFIG}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    );
  }

  return null;
}

export function BaselineCheckIntro({ module, onStart, onSkip, skipping }) {
  return (
    <div className="baseline-check-shell">
      <div className="baseline-check-hero card-surface">
        <span className="baseline-check-badge">Optional · ~2 min</span>
        <h1 className="baseline-check-title">See where you&apos;re starting</h1>
        <p className="baseline-check-module-name">{module?.name}</p>
        <p className="baseline-check-lead">
          A quick {DIAGNOSTIC_QUESTIONS_PER_MODULE}-question AI check helps Veridian place this module
          at the right starting stage. Skipping is fine — you can study right away and take it later.
        </p>
      </div>

      <div className="baseline-check-grid">
        <div className="baseline-check-info-card card-surface">
          <h2 className="baseline-check-info-title">What it measures</h2>
          <p>How well you can apply this module&apos;s core ideas — not just recognize terms from a list.</p>
        </div>
        <div className="baseline-check-info-card card-surface">
          <h2 className="baseline-check-info-title">Why it&apos;s optional</h2>
          <p>Veridian works without it. The check only fine-tunes your starting stage and study recommendations.</p>
        </div>
        <div className="baseline-check-info-card card-surface">
          <h2 className="baseline-check-info-title">What happens after</h2>
          <p>We suggest a starting stage for this module and tailor what shows up in your study queue.</p>
        </div>
      </div>

      <ol className="baseline-check-steps card-surface">
        <li><span>1</span> Answer {DIAGNOSTIC_QUESTIONS_PER_MODULE} short questions</li>
        <li><span>2</span> Set your confidence level</li>
        <li><span>3</span> Jump into the module at the right stage</li>
      </ol>

      <div className="baseline-check-actions">
        <button type="button" className="btn btn-primary" onClick={onStart}>
          Start check
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSkip} disabled={skipping}>
          {skipping ? 'Skipping…' : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
