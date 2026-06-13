import { useState } from 'react';
import { toast } from 'sonner';
import VeridianLoading from '@/components/shared/VeridianLoading';
import FreeRecallEditor from '@/components/study/free-recall/FreeRecallEditor';
import FreeRecallSummary from '@/components/study/free-recall/FreeRecallSummary';
import { generateFreeRecallHint, gradeFreeRecall } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function FreeRecallSession({ session, activity, module, journeyId }) {
  const { data: journey } = useJourney(journeyId);
  const [response, setResponse] = useState('');
  const [hints, setHints] = useState([]);
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('active');
  const [result, setResult] = useState(null);
  const [summaryMeta, setSummaryMeta] = useState(null);

  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;
  const moduleName = module?.name ?? 'this module';

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleGenerateHint = async () => {
    if (hints.length >= 3 || hintLoading) return;
    setHintLoading(true);
    try {
      const tier = hints.length + 1;
      const data = await generateFreeRecallHint({
        tier,
        moduleName,
        moduleDescription: module?.description,
        knowledgeMap: module?.knowledgeMap,
        studentResponseSoFar: response,
        previousHints: hints.map((h) => h.text),
      });
      const text = String(data?.hint ?? '').trim();
      if (!text) throw new Error('Empty hint from AI');
      setHints((prev) => [...prev, { tier, text }]);
    } catch (err) {
      toast.error(err.message || 'Failed to generate hint');
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmit = async ({ elapsedSec, wasVoice }) => {
    setSubmitting(true);
    try {
      const graded = await gradeFreeRecall({
        recallPrompt: moduleName,
        moduleName,
        moduleDescription: module?.description,
        studentResponse: response,
        hintsUsed: hints.length,
        hints: hints.map((h) => h.text),
        knowledgeMap: module?.knowledgeMap,
      });

      const sessionData = {
        recallPrompt: moduleName,
        rawStudentResponse: response,
        wasVoiceInput: wasVoice,
        durationSec: elapsedSec,
        characterCount: response.length,
        hintsUsed: hints.length,
        hints,
        coveragePercent: graded?.coveragePercent ?? 0,
        coverageEstimate: graded?.coverageEstimate ?? '',
        missedIdeas: graded?.missedIdeas ?? graded?.conceptsMissed ?? [],
        incorrectIdeas: graded?.incorrectIdeas ?? [],
        hintsUsedNote: graded?.hintsUsedNote ?? '',
        aiGradingSummary: graded?.feedback ?? graded?.aiGradingSummary ?? '',
        nextConceptRecommendation: graded?.nextConceptToRevisit ?? graded?.nextConceptRecommendation ?? '',
      };

      setResult(graded);
      setSummaryMeta({
        elapsedSec,
        wasVoice,
        characterCount: response.length,
        hintsUsed: hints.length,
      });
      setPhase('summary');

      completeSessionInBackground({
        sessionId: session.sessionId,
        journeyId,
        activityId: activity.activityId,
        activity,
        sessionData,
        score: graded?.coveragePercent ?? 0,
        outcomeSummary: {
          nextAction: graded?.nextConceptToRevisit ?? graded?.nextConceptRecommendation,
        },
        startedAt: session.startedAt,
      });
    } catch (err) {
      toast.error(err.message || 'Grading failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'summary' && result && summaryMeta) {
    return (
      <FreeRecallSummary
        response={response}
        characterCount={summaryMeta.characterCount}
        totalTimeSec={summaryMeta.elapsedSec}
        hintsUsed={summaryMeta.hintsUsed}
        result={result}
        moduleTitle={moduleName}
        journeyTitle={journey?.title}
        returnHref="/home"
      />
    );
  }

  if (submitting) {
    return (
      <div className="study-mode-view free-recall-mode-view">
        <VeridianLoading fullPage label="Grading your recall…" />
      </div>
    );
  }

  return (
    <FreeRecallEditor
      moduleName={moduleName}
      response={response}
      onResponseChange={setResponse}
      hints={hints}
      hintLoading={hintLoading}
      hintModalOpen={hintModalOpen}
      onHintModalOpen={() => setHintModalOpen(true)}
      onHintModalClose={() => setHintModalOpen(false)}
      onGenerateHint={handleGenerateHint}
      onSubmit={handleSubmit}
      submitting={submitting}
      onExit={handleExit}
    />
  );
}
