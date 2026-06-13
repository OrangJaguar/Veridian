import { useState } from 'react';
import StudyChrome from '@/components/study/StudyChrome';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import SessionSummary from '@/components/study/SessionSummary';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import { generateJourneyChallenge } from '@/api/ai/study';
import { normalizeQuizQuestions } from '@/utils/study/normalizeQuizQuestions';
import { requireGeneratedQuestions } from '@/utils/study/requireGeneratedQuestions';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useJourney } from '@/hooks/queries/useJourneys';

const LENGTH_MAP = { short: 8, medium: 10, long: 12 };

export default function JourneyChallengeSession({ session, activity, journeyId, modules = [] }) {
  const { data: journey } = useJourney(journeyId);
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [length, setLength] = useState('medium');
  const [weighting, setWeighting] = useState('balanced');
  const [loading, setLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateSession = useUpdateSession();
  const returnPath = `/journeys/${journeyId}`;

  const handleExit = () => {
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const start = async () => {
    setLoading(true);
    setGenError(null);
    try {
      const count = LENGTH_MAP[length];
      const nextQuestions = await runStudyAiGeneration({
        generate: () => generateJourneyChallenge({
          journeyTitle: journey?.title,
          subject: journey?.subject,
          questionCount: count,
          weighting,
          moduleMaps: modules.map((m) => ({
            moduleId: m.moduleId,
            name: m.name,
            stage: m.stage,
            concepts: m.knowledgeMap?.concepts ?? [],
          })),
        }),
        normalize: (raw) => normalizeQuizQuestions(raw, count),
        validate: (list) => requireGeneratedQuestions(list, count, 'questions'),
        persist: async (list) => {
          await updateSession.mutateAsync({
            sessionId: session.sessionId,
            journeyId,
            patch: {
              sessionData: {
                questions: list,
                length,
                weighting,
                aiGeneration: { status: 'ready', completedAt: Date.now() },
              },
            },
          });
        },
      });

      setQuestions(nextQuestions);
      setPhase('active');
    } catch (err) {
      setGenError(err?.message || 'Failed to start challenge');
    } finally {
      setLoading(false);
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
    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData,
      score: accuracy,
      outcomeSummary: { accuracy, nextAction: sessionData.recommendedStudyPlan },
      startedAt: session.startedAt,
    });
  };

  if (phase === 'summary') {
    return <SessionSummary title="Journey Challenge complete" returnHref={returnPath} />;
  }

  if (genError && phase === 'setup') {
    return (
      <StudyChrome title="Journey Challenge" onExit={handleExit}>
        <StudyAiError message={genError} onRetry={() => { setGenError(null); start(); }} onExit={handleExit} />
      </StudyChrome>
    );
  }

  return (
    <StudyChrome title="Journey Challenge" onExit={handleExit}>
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
          <button type="button" className="btn btn-primary" disabled={loading} onClick={start}>
            {loading ? 'Generating…' : 'Start challenge'}
          </button>
        </>
      )}
      {phase === 'active' && questions.length > 0 && (
        <QuizRunner questions={questions} onComplete={handleComplete} onExit={handleExit} />
      )}
    </StudyChrome>
  );
}
