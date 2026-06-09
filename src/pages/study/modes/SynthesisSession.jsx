import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generateSynthesisQuestions } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

export default function SynthesisSession({ session, activity, module, journeyId, modules = [] }) {
  const [questions, setQuestions] = useState([]);
  const [phase, setPhase] = useState('loading');
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  useEffect(() => {
    (async () => {
      try {
        const moduleMaps = modules.filter((m) => m.journeyId === journeyId).map((m) => ({
          moduleId: m.moduleId,
          name: m.name,
          knowledgeMap: m.knowledgeMap,
        }));
        const result = await generateSynthesisQuestions({ moduleMaps, questionCount: 5 });
        setQuestions(result.data?.questions ?? result.questions ?? []);
        setPhase('active');
      } catch (err) {
        toast.error(err.message || 'Failed to generate synthesis questions');
        setPhase('error');
      }
    })();
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
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review modules where integration broke down' },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  if (phase === 'summary') {
    return <SessionSummary title="Synthesis complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Synthesis" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'loading' && <p className="journeys-status">Generating synthesis questions…</p>}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
    </StudyChrome>
  );
}
