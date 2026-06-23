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
import { updateModule } from '@/api/entities/modules';
import { buildBaselineQuestions } from '@/utils/research/buildBaselineQuestions';
import { withConfidenceSlider, quizPhaseAfterQuestions } from '@/utils/research/sessionConfidence';

const BASELINE_CONFIG = {
  strictMode: false,
  instantFeedback: false,
  diagnosticMode: false,
};

export default function BaselineCheckSession({
  session,
  activity,
  module,
  journeyId,
  journey,
  practiceQuizActivity,
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
      const bank = practiceQuizActivity?.content?.questionBank ?? [];
      const nextQuestions = await buildBaselineQuestions({
        questionBank: bank,
        module,
        journey,
      });
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
  }, [journey, module, practiceQuizActivity, session.sessionData, session.sessionId, journeyId, updateSession]);

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
    const baselineResults = answers.map((a) => {
      const q = questions.find((qq) => qq.id === a.questionId);
      return {
        questionId: a.questionId,
        wasCorrect: !!a.correct,
        difficultyEstimate: q?.difficultyEstimate ?? q?.difficulty ?? 'medium',
      };
    });
    const sessionData = withConfidenceSlider({
      questions,
      answers,
      baselineResults,
    }, { confidenceSlider: confidenceSlider ?? session.sessionData?.confidenceSlider });

    await updateModule(module.moduleId, {
      baselineScore: accuracy,
      baselineCapturedAt: Date.now(),
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
        action="generatePracticeQuestions"
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
        A few quick questions so Veridian can focus on what you actually need.
      </p>
      <p className="baseline-check-meta">{BASELINE_QUESTION_COUNT} questions · {module?.name}</p>
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
