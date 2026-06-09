import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizSetupForm from '@/components/study/quiz/QuizSetupForm';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generateInterleavedQuestions } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

export default function InterleavedSession({ session, activity, journeyId, modules = [] }) {
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState(modules.map((m) => m.moduleId));
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}`;

  const handleStart = async (config) => {
    try {
      const moduleMaps = modules
        .filter((m) => selectedModuleIds.includes(m.moduleId))
        .map((m) => ({ moduleId: m.moduleId, name: m.name, knowledgeMap: m.knowledgeMap }));
      const result = await generateInterleavedQuestions({
        moduleMaps,
        questionCount: config.questionCount,
      });
      setQuestions(result.data?.questions ?? result.questions ?? []);
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to generate questions');
    }
  };

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const sessionData = {
      selectedModuleIds,
      questions,
      answers,
      perModuleAccuracy: {},
    };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: 'Review modules that collapsed under mixing' },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  if (phase === 'summary') {
    return <SessionSummary title="Interleaved Review complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Interleaved Review" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'setup' && (
        <>
          <fieldset className="study-setup-field">
            <legend>Modules to include</legend>
            {modules.map((m) => (
              <label key={m.moduleId} className="study-setup-check">
                <input
                  type="checkbox"
                  checked={selectedModuleIds.includes(m.moduleId)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedModuleIds([...selectedModuleIds, m.moduleId]);
                    else setSelectedModuleIds(selectedModuleIds.filter((id) => id !== m.moduleId));
                  }}
                />
                {m.name}
              </label>
            ))}
          </fieldset>
          <QuizSetupForm onStart={handleStart} />
        </>
      )}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
    </StudyChrome>
  );
}
