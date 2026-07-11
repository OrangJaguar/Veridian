import { useState, useCallback, useEffect } from 'react';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import PreQuizConfidenceStep from '@/components/research/PreQuizConfidenceStep';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import SessionSummary from '@/components/study/SessionSummary';
import { usePreQuizConfidence } from '@/hooks/research/usePreQuizConfidence';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
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
  const [phase, setPhase] = useState(() => quizPhaseAfterQuestions(session, 'loading'));
  const [questions, setQuestions] = useState(() => session.sessionData?.questions ?? []);
  const [loading, setLoading] = useState(!session.sessionData?.questions?.length);
  const [genError, setGenError] = useState(null);
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

  const generate = useCallback(async () => {
    setLoading(true);
    setGenError(null);
    try {
      const raw = await invokeWithRetry((signal) => generateDiagnosticQuestions({
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
      }, { signal }));

      const nextQuestions = normalizeDiagnosticQuestions(
        raw.questions ?? raw,
        [module],
        DIAGNOSTIC_QUESTIONS_PER_MODULE,
      );
      if (!nextQuestions.length) {
        throw new Error('AI returned no diagnostic questions. Try again.');
      }

      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: {
          sessionData: {
            ...session.sessionData,
            questions: nextQuestions,
            aiGeneration: { status: 'ready', completedAt: Date.now() },
          },
        },
      });
      setQuestions(nextQuestions);
      setPhase('confidence');
    } catch (err) {
      setGenError(err instanceof Error ? err : new Error(String(err)));
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [journey, module, session.sessionData, session.sessionId, journeyId, updateSession]);

  useEffect(() => {
    if (!session.sessionData?.questions?.length) {
      generate();
    }
  }, [generate, session.sessionData?.questions?.length]);

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

  if (loading && !questions.length) {
    return (
      <AiGenerationLoading
        action="generateDiagnosticQuestions"
        className="study-mode-view"
      />
    );
  }

  if (genError) {
    return (
      <StudyAiError message={genError?.message} error={genError} onRetry={generate} onExit={handleExit} />
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
    <div className="baseline-check-intro">
      <h1 className="baseline-check-title">See where you&apos;re starting</h1>
      <p className="baseline-check-lead">
        An optional {DIAGNOSTIC_QUESTIONS_PER_MODULE}-question AI check so Veridian can place
        this module at the right starting stage. Skipping is completely fine — you can study
        right away and take it later.
      </p>
      <p className="baseline-check-meta">{DIAGNOSTIC_QUESTIONS_PER_MODULE} questions · {module?.name}</p>
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
