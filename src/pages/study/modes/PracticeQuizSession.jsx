import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizSetupForm from '@/components/study/quiz/QuizSetupForm';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
// import { generatePracticeQuestions, generateConceptRefresher } from '@/api/ai/study';
import { pickQuestions } from '@/fixtures/starterJourney/aiJourneyContent';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

const STATIC_REFRESHERS = {
  supervised: { recap: 'Supervised learning maps inputs to known outputs using labeled examples.', example: 'Email → spam/not spam labels train the classifier.' },
  loss: { recap: 'Loss measures prediction error; training minimizes it via gradient descent.', example: 'Cross-entropy penalizes confident wrong class predictions.' },
  'gradient-descent': { recap: 'Parameters update opposite the loss gradient: θ ← θ − η∇L.', example: 'Learning rate η controls step size on the loss surface.' },
  backprop: { recap: 'Backprop applies the chain rule to compute ∂loss/∂weight through layers.', example: 'Output error propagates backward to adjust early-layer weights.' },
  overfitting: { recap: 'Overfitting = great training performance, poor test performance.', example: 'Add validation monitoring, regularization, or more diverse data.' },
};

export default function PracticeQuizSession({ session, activity, module, journeyId }) {
  const preloaded = activity.content?.questions ?? [];
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [config, setConfig] = useState(activity.content?.lastConfig ?? {});
  const [loading, setLoading] = useState(false);
  const [summaryAccuracy, setSummaryAccuracy] = useState(null);
  const [refresherContent, setRefresherContent] = useState(null);
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();

  const handleStart = async (setupConfig) => {
    setLoading(true);
    try {
      if (preloaded.length > 0) {
        setQuestions(pickQuestions(preloaded, setupConfig.questionCount));
      } else {
        toast.error('No questions available for this quiz yet.');
        return;
      }
      // AI generation (disabled until geminiStudy is deployed):
      // const result = await generatePracticeQuestions({ ... });
      // setQuestions(result.data?.questions ?? []);
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
    // AI refresher (disabled):
    // const result = await generateConceptRefresher({ concept, knowledgeMap });
    // setRefresherContent(result.data ?? result);
  };

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = { config, questions, answers, interventions: [] };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
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
    setSummaryAccuracy(accuracy);
    setPhase('summary');
  };

  const returnPath = module?.moduleId
    ? `/journeys/${journeyId}/modules/${module.moduleId}`
    : `/journeys/${journeyId}`;

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Quiz complete"
        stats={[{ label: 'Accuracy', value: `${summaryAccuracy ?? '—'}%` }]}
        nextAction="Keep practicing weak spots or move to flashcards."
        returnHref={returnPath}
      />
    );
  }

  return (
    <StudyChrome
      title="Practice Quiz"
      progressText={phase === 'active' ? `Quiz · ${module?.name ?? ''}` : 'Setup'}
      onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}
    >
      {phase === 'setup' && (
        <QuizSetupForm defaultConfig={config} onStart={handleStart} loading={loading} />
      )}
      {phase === 'active' && (
        <QuizRunner
          questions={questions}
          onComplete={handleComplete}
          onIntervention={handleIntervention}
          refresherContent={refresherContent}
        />
      )}
    </StudyChrome>
  );
}
