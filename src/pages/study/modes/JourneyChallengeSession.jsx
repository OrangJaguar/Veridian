import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { generateJourneyChallenge } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

const LENGTH_MAP = { short: 15, medium: 30, long: 50 };

export default function JourneyChallengeSession({ session, activity, journeyId, modules = [] }) {
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [length, setLength] = useState('medium');
  const [weighting, setWeighting] = useState('balanced');
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}`;

  const start = async () => {
    try {
      const moduleMaps = modules.map((m) => ({
        moduleId: m.moduleId,
        name: m.name,
        knowledgeMap: m.knowledgeMap,
        masteryScore: m.masteryScore,
      }));
      const result = await generateJourneyChallenge({
        moduleMaps,
        questionCount: LENGTH_MAP[length],
        weighting,
      });
      setQuestions(result.data?.questions ?? result.questions ?? []);
      setPhase('active');
    } catch (err) {
      toast.error(err.message || 'Failed to start challenge');
    }
  };

  const handleComplete = async (answers) => {
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    const readiness = accuracy >= 80 ? 'examReady' : accuracy >= 55 ? 'nearlyReady' : 'notReady';
    const sessionData = {
      selectedModuleIds: modules.map((m) => m.moduleId),
      questions,
      answers,
      overallReadinessSignal: readiness,
      recommendedStudyPlan: readiness === 'examReady'
        ? 'Maintain with light review'
        : 'Focus on weakest modules from breakdown',
    };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: sessionData.recommendedStudyPlan },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  if (phase === 'summary') {
    return <SessionSummary title="Journey Challenge complete" returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Journey Challenge" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'setup' && (
        <>
          <label className="study-setup-field">
            Length
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </label>
          <label className="study-setup-field">
            Weighting
            <select value={weighting} onChange={(e) => setWeighting(e.target.value)}>
              <option value="balanced">Balanced</option>
              <option value="weak">Bias weak areas</option>
            </select>
          </label>
          <button type="button" className="btn btn-primary" onClick={start}>Start challenge</button>
        </>
      )}
      {phase === 'active' && <QuizRunner questions={questions} onComplete={handleComplete} />}
    </StudyChrome>
  );
}
