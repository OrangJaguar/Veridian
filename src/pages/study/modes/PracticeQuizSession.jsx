import { useState } from 'react';
import { toast } from 'sonner';
import QuizSetupModal from '@/components/study/quiz/QuizSetupModal';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import QuizSummary from '@/components/study/quiz/QuizSummary';
import { pickQuestions } from '@/fixtures/starterJourney/aiJourneyContent';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useJourney } from '@/hooks/queries/useJourneys';

const STATIC_REFRESHERS = {
  supervised: { recap: 'Supervised learning maps inputs to known outputs using labeled examples.', example: 'Email → spam/not spam labels train the classifier.' },
  loss: { recap: 'Loss measures prediction error; training minimizes it via gradient descent.', example: 'Cross-entropy penalizes confident wrong class predictions.' },
  'gradient-descent': { recap: 'Parameters update opposite the loss gradient: θ ← θ − η∇L.', example: 'Learning rate η controls step size on the loss surface.' },
  backprop: { recap: 'Backprop applies the chain rule to compute ∂loss/∂weight through layers.', example: 'Output error propagates backward to adjust early-layer weights.' },
  overfitting: { recap: 'Overfitting = great training performance, poor test performance.', example: 'Add validation monitoring, regularization, or more diverse data.' },
};

function initialPhase(session, initialConfig) {
  if (session.status === 'completed' && session.sessionData?.answers?.length) return 'summary';
  if (initialConfig) return 'active';
  return 'setup';
}

export default function PracticeQuizSession({ session, activity, module, journeyId }) {
  const preloaded = activity.content?.questions ?? [];
  const initialConfig = session.sessionData?.quizConfig;
  const { data: journey } = useJourney(journeyId);

  const [phase, setPhase] = useState(() => initialPhase(session, initialConfig));
  const [questions, setQuestions] = useState(() => {
    if (session.sessionData?.questions?.length) return session.sessionData.questions;
    if (initialConfig && preloaded.length) return pickQuestions(preloaded, initialConfig.questionCount);
    return [];
  });
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

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath: '/home' });
  };

  const handleStart = async (setupConfig) => {
    setLoading(true);
    try {
      if (preloaded.length > 0) {
        setQuestions(pickQuestions(preloaded, setupConfig.questionCount));
      } else {
        toast.error('No questions available for this quiz yet.');
        return;
      }
      setConfig(setupConfig);
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleIntervention = async (conceptId) => {
    setRefresherContent(
      STATIC_REFRESHERS[conceptId] ?? { recap: 'Review this concept in your learning guide.', example: '' },
    );
  };

  const handleComplete = (answers, totalTimeSec) => {
    const graded = answers.filter((a) => !a.skipped);
    const correct = graded.filter((a) => a.correct).length;
    const accuracy = graded.length ? Math.round((correct / graded.length) * 100) : 0;
    const sessionData = { config, questions, answers, interventions: [] };

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
