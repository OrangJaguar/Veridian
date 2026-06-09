import { useState } from 'react';
import { toast } from 'sonner';
import StudyChrome from '@/components/study/StudyChrome';
import SessionSummary from '@/components/study/SessionSummary';
import OpenResponseEditor from '@/components/study/shared/OpenResponseEditor';
import LatexRenderer from '@/components/shared/LatexRenderer';
// import { gradeFeynman } from '@/api/ai/study';
import { mockGradeFeynman } from '@/fixtures/study/mockGrading';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';

export default function FeynmanSession({ session, activity, module, journeyId }) {
  const concepts = module?.knowledgeMap?.concepts ?? [];
  const [conceptId, setConceptId] = useState(concepts[0]?.id ?? '');
  const [response, setResponse] = useState('');
  const [wasVoice, setWasVoice] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [followUp, setFollowUp] = useState('');
  const [phase, setPhase] = useState('explain');
  const completeSession = useCompleteSession();
  const abandonSession = useAbandonSession();

  const concept = concepts.find((c) => c.id === conceptId);
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  const submit = async () => {
    try {
      // AI grading (disabled until geminiStudy is deployed):
      // const result = await gradeFeynman({ concept, studentResponse: response, knowledgeMap });
      const data = mockGradeFeynman({ concept: concept ?? { term: conceptId } });
      setFeedback(data);
      setPhase('feedback');
    } catch (err) {
      toast.error(err.message || 'Grading failed');
    }
  };

  const finish = async () => {
    const sessionData = {
      conceptPrompt: concept?.term ?? conceptId,
      rawStudentResponse: response,
      wasVoiceInput: wasVoice,
      aiFeedback: feedback?.aiFeedback ?? '',
      missingConcepts: feedback?.missingConcepts ?? [],
      misconceptionsDetected: feedback?.misconceptionsDetected ?? [],
      weakestPoint: feedback?.weakestPoint ?? '',
      followUpQuestion: feedback?.followUpQuestion ?? '',
      followUpResponse: followUp || null,
      overallConfidenceRating: feedback?.overallConfidenceRating ?? 'partial',
    };
    await completeSession({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      sessionData,
      score: feedback?.overallConfidenceRating === 'strong' ? 100 : feedback?.overallConfidenceRating === 'partial' ? 60 : 20,
      outcomeSummary: { nextAction: feedback?.weakestPoint },
      startedAt: session.startedAt,
    });
    setPhase('summary');
  };

  if (phase === 'summary') {
    return <SessionSummary title="Feynman complete" returnHref={returnPath} nextAction="Review your weakest point before synthesis." />;
  }

  return (
    <StudyChrome title="Feynman Mode" onExit={() => abandonSession({ sessionId: session.sessionId, journeyId, returnPath })}>
      {phase === 'explain' && (
        <>
          <label className="study-setup-field">
            Concept
            <select value={conceptId} onChange={(e) => setConceptId(e.target.value)}>
              {concepts.map((c) => <option key={c.id} value={c.id}>{c.term}</option>)}
            </select>
          </label>
          <p>Explain <strong>{concept?.term}</strong> in your own words:</p>
          <OpenResponseEditor value={response} onChange={(v) => { setResponse(v); setWasVoice(false); }} placeholder="Type or use voice…" />
          <button type="button" className="btn btn-primary" disabled={!response.trim()} onClick={submit}>Submit explanation</button>
        </>
      )}
      {phase === 'feedback' && feedback && (
        <>
          <LatexRenderer text={feedback.aiFeedback} />
          <p><strong>Weakest point:</strong> {feedback.weakestPoint}</p>
          <p><strong>Follow-up:</strong> {feedback.followUpQuestion}</p>
          <OpenResponseEditor value={followUp} onChange={setFollowUp} placeholder="Optional follow-up answer…" rows={4} />
          <button type="button" className="btn btn-primary" onClick={finish}>Finish session</button>
        </>
      )}
    </StudyChrome>
  );
}
