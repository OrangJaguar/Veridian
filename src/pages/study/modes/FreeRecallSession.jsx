import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import FreeRecallEditor from '@/components/study/free-recall/FreeRecallEditor';
import FreeRecallSummary from '@/components/study/free-recall/FreeRecallSummary';
import { generateFreeRecallHints, generateFreeRecallHint, gradeFreeRecall } from '@/api/ai/study';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useJourney } from '@/hooks/queries/useJourneys';

const MAX_HINTS = 3;

async function preloadRecallHints(module) {
  const base = {
    moduleName: module?.name ?? 'this module',
    moduleDescription: module?.description,
    knowledgeMap: module?.knowledgeMap,
    studentResponseSoFar: '',
  };

  try {
    const data = await generateFreeRecallHints(base);
    const hints = (data?.hints ?? [])
      .map((h) => ({ tier: h.tier, text: String(h.hint ?? h.text ?? '').trim() }))
      .filter((h) => h.text)
      .sort((a, b) => a.tier - b.tier);
    if (hints.length >= MAX_HINTS) return hints.slice(0, MAX_HINTS);
  } catch {
    /* fall through to sequential preload */
  }

  const built = [];
  for (let tier = 1; tier <= MAX_HINTS; tier += 1) {
    const data = await generateFreeRecallHint({
      ...base,
      tier,
      previousHints: built.map((h) => h.text),
    });
    const text = String(data?.hint ?? '').trim();
    if (!text) break;
    built.push({ tier, text });
  }
  return built;
}

export default function FreeRecallSession({ session, activity, module, journeyId }) {
  const { data: journey } = useJourney(journeyId);
  const [response, setResponse] = useState('');
  const [hints, setHints] = useState([]);
  const [preloadedHints, setPreloadedHints] = useState([]);
  const [hintsPreloading, setHintsPreloading] = useState(true);
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const hintsPreloadStarted = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [gradeError, setGradeError] = useState(null);
  const [phase, setPhase] = useState('active');
  const [result, setResult] = useState(null);
  const [summaryMeta, setSummaryMeta] = useState(null);

  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;
  const moduleName = module?.name ?? 'this module';
  const concepts = module?.knowledgeMap?.concepts ?? [];

  useEffect(() => {
    if (!module?.moduleId || hintsPreloadStarted.current) return undefined;
    hintsPreloadStarted.current = true;
    let cancelled = false;

    preloadRecallHints(module)
      .then((loaded) => {
        if (!cancelled) setPreloadedHints(loaded);
      })
      .catch(() => {
        /* hints remain empty — user can still finish without them */
      })
      .finally(() => {
        if (!cancelled) setHintsPreloading(false);
      });

    return () => { cancelled = true; };
  }, [module?.moduleId, module]);

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleGenerateHint = () => {
    if (hints.length >= MAX_HINTS) return;

    const next = preloadedHints[hints.length];
    if (next) {
      setHints((prev) => [...prev, next]);
      return;
    }

    if (hintsPreloading) {
      toast.message('Hints are still loading — try again in a moment.');
    } else {
      toast.error('Hints unavailable right now.');
    }
  };

  const handleSubmit = async ({ elapsedSec, wasVoice }) => {
    setSubmitting(true);
    setGradeError(null);
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
      setGradeError(err.message || 'Grading failed');
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
      <AiGenerationLoading
        action="gradeFreeRecall"
        className="study-mode-view free-recall-mode-view"
      />
    );
  }

  return (
    <>
      {gradeError && (
        <div className="study-ai-inline-error study-mode-view" role="alert">
          <p>{gradeError}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setGradeError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <FreeRecallEditor
      moduleName={moduleName}
      concepts={concepts}
      response={response}
      onResponseChange={setResponse}
      hints={hints}
      hintsPreloading={hintsPreloading}
      hintModalOpen={hintModalOpen}
      onHintModalOpen={() => setHintModalOpen(true)}
      onHintModalClose={() => setHintModalOpen(false)}
      onGenerateHint={handleGenerateHint}
      onSubmit={handleSubmit}
      submitting={submitting}
      onExit={handleExit}
    />
    </>
  );
}
