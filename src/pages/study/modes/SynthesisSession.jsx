import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import VeridianLoading from '@/components/shared/VeridianLoading';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
// import { generateSynthesisQuestions } from '@/api/ai/study';
import { pickQuestions } from '@/fixtures/starterJourney/aiJourneyContent';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

export default function SynthesisSession({ session, activity, module, journeyId, modules = [] }) {
  const preloaded = activity.content?.questions ?? [];
  const [questions, setQuestions] = useState([]);
  const [phase, setPhase] = useState('loading');
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  useEffect(() => {
    if (preloaded.length > 0) {
      setQuestions(pickQuestions(preloaded, 6));
      setPhase('active');
      return;
    }
    // AI generation (disabled):
    // generateSynthesisQuestions(...).then(...)
    toast.error('No synthesis questions available yet.');
    setPhase('error');
  }, []);

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = {
      modulesInvolved: modules.map((m) => m.moduleId),
      questions,
      answers,
      integrationReadinessSignal: accuracy >= 70 ? 'strong' : accuracy >= 40 ? 'partial' : 'weak',
    };
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review modules where integration broke down' },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary') {
    return <SessionSummary title="Synthesis complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Synthesis" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'loading' && <VeridianLoading />}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
      {phase === 'error' && <p className="journeys-error">Could not load synthesis questions.</p>}
    </StudyChrome>
  );
}
