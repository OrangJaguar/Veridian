import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import SessionSummary from '@/components/study/SessionSummary';
import OpenResponseEditor from '@/components/study/shared/OpenResponseEditor';
// import { gradeFreeRecall } from '@/api/ai/study';
import { mockGradeFreeRecall } from '@/fixtures/study/mockGrading';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

const HINTS = [
  (mod) => `Section: ${mod?.name ?? 'Module overview'}`,
  (mod) => {
    const term = mod?.knowledgeMap?.concepts?.[0]?.term;
    return term ? `Key term: ${term}` : 'Think about core vocabulary';
  },
  () => 'Focus on relationships between the main ideas.',
];

export default function FreeRecallSession({ session, activity, module, journeyId }) {
  const [response, setResponse] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintTiers, setHintTiers] = useState([]);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('recall');
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  const revealHint = () => {
    if (hintsUsed >= HINTS.length) return;
    setHintsUsed(hintsUsed + 1);
    setHintTiers([...hintTiers, hintsUsed + 1]);
  };

  const submit = async () => {
    try {
      // AI grading (disabled until geminiStudy is deployed):
      // const graded = await gradeFreeRecall({ recallPrompt, studentResponse: response, hintsUsed, knowledgeMap });
      const data = mockGradeFreeRecall({ studentResponse: response, hintsUsed });
      setResult(data);
      setPhase('result');
    } catch (err) {
      toast.error(err.message || 'Grading failed');
    }
  };

  const finish = async () => {
    const sessionData = {
      recallPrompt: module?.name ?? '',
      rawStudentResponse: response,
      wasVoiceInput: false,
      hintsUsed,
      hintTiersRevealed: hintTiers,
      coveragePercent: result?.coveragePercent ?? 0,
      conceptsCovered: result?.conceptsCovered ?? [],
      conceptsMissed: result?.conceptsMissed ?? [],
      incorrectIdeas: result?.incorrectIdeas ?? [],
      aiGradingSummary: result?.aiGradingSummary ?? '',
      nextConceptRecommendation: result?.nextConceptRecommendation ?? '',
    };
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: result?.coveragePercent ?? 0,
      outcomeSummary: { nextAction: result?.nextConceptRecommendation },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary') {
    return <SessionSummary title="Free Recall complete" stats={[{ label: 'Coverage', value: `${result?.coveragePercent ?? 0}%` }]} returnHref={returnPath} />;
  }

  return (
    <StudyChrome title="Free Recall" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'recall' && (
        <>
          <p>Write everything you remember about <strong>{module?.name}</strong>:</p>
          <OpenResponseEditor value={response} onChange={setResponse} placeholder="Brain dump…" />
          <div className="study-hint-row">
            <button type="button" className="btn btn-secondary btn-sm" disabled={hintsUsed >= HINTS.length} onClick={revealHint}>
              Hint ({hintsUsed}/{HINTS.length})
            </button>
            {hintTiers.map((tier) => (
              <p key={tier} className="study-hint-text">{HINTS[tier - 1](module)}</p>
            ))}
          </div>
          <button type="button" className="btn btn-primary" disabled={!response.trim()} onClick={submit}>Submit recall</button>
        </>
      )}
      {phase === 'result' && result && (
        <>
          <p>Coverage: <strong>{result.coveragePercent}%</strong></p>
          <p>{result.aiGradingSummary}</p>
          <p>Next: {result.nextConceptRecommendation}</p>
          <button type="button" className="btn btn-primary" onClick={finish}>Finish</button>
        </>
      )}
    </StudyChrome>
  );
}
