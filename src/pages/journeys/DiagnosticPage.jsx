import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCreateSession } from '@/hooks/mutations/useSessionMutations';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import DiagnosticIntro from '@/components/diagnostic/DiagnosticIntro';
import DiagnosticSummary from '@/components/diagnostic/DiagnosticSummary';
import QuizRunner from '@/components/study/quiz/QuizRunner';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import { generateDiagnosticQuestions } from '@/api/ai/study';
import { generateDiagnosticQuestionsProgressive } from '@/utils/study/generateDiagnosticQuestionsProgressive';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';
import { applyDiagnosticResults } from '@/api/entities/applyDiagnosticResults';
import { ensureDiagnosticActivity } from '@/api/entities/ensureDiagnosticActivity';
import { updateJourney } from '@/api/entities/journeys';
import { queryKeys } from '@/api/query-keys';
import { normalizeDiagnosticQuestions } from '@/utils/study/normalizeDiagnosticQuestions';
import {
  DIAGNOSTIC_QUESTIONS_PER_MODULE,
  computeDiagnosticPlacement,
  difficultyGuidanceForPriorKnowledge,
  interleaveDiagnosticQuestions,
  validateDiagnosticQuestions,
} from '@/utils/study/diagnosticPlacement';

const DIAGNOSTIC_CONFIG = {
  strictMode: false,
  instantFeedback: false,
  diagnosticMode: true,
};

function findDiagnosticActivity(activities) {
  return activities.find((a) => a.type === 'diagnostic' && a.scope === 'journey');
}

function findResumableSession(sessions, activityId) {
  return sessions.find(
    (s) => s.activityId === activityId
      && s.activityType === 'diagnostic'
      && s.status === 'in_progress'
      && s.sessionData?.questions?.length,
  );
}

function initialPhase(journey, resumableSession) {
  if (journey?.diagnosticSummary) return 'done';
  if (resumableSession) return 'active';
  return 'intro';
}

export default function DiagnosticPage() {
  const { id: journeyId } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: journey, isPending: journeyPending } = useJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const diagnosticActivity = useMemo(
    () => findDiagnosticActivity(activities),
    [activities],
  );
  const resumableSession = useMemo(
    () => (diagnosticActivity ? findResumableSession(sessions, diagnosticActivity.activityId) : null),
    [sessions, diagnosticActivity],
  );

  const [phase, setPhase] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [activityReady, setActivityReady] = useState(false);
  const [genError, setGenError] = useState(null);
  const [moduleProgress, setModuleProgress] = useState(null);
  const generatingRef = useRef(false);

  const resolvedPhase = phase ?? (journey ? initialPhase(journey, resumableSession) : null);

  useEffect(() => {
    if (!journeyId || !journey) return;
    let cancelled = false;

    (async () => {
      try {
        await ensureDiagnosticActivity(journeyId, activities);
        if (!cancelled) {
          setActivityReady(true);
          queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
        }
      } catch {
        if (!cancelled) setActivityReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [journeyId, activities, journey, queryClient]);

  useEffect(() => {
    if (!resumableSession || questions.length) return;
    setSession(resumableSession);
    setQuestions(resumableSession.sessionData.questions);
    setPhase('active');
  }, [resumableSession, questions.length]);

  const questionCount = modules.length * DIAGNOSTIC_QUESTIONS_PER_MODULE;

  const invalidateJourney = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
    queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
  }, [queryClient, journeyId]);

  const handleSkip = async () => {
    if (skipping) return;
    setSkipping(true);
    try {
      await updateJourney(journeyId, { diagnosticSkipped: true });
      invalidateJourney();
      setPhase('skipped');
    } catch (err) {
      toast.error(err.message || 'Could not skip diagnostic');
    } finally {
      setSkipping(false);
    }
  };

  const handleStart = async () => {
    if (generatingRef.current || generating || !modules.length || !activityReady) return;
    generatingRef.current = true;
    setGenerating(true);
    setGenError(null);
    setModuleProgress(null);

    try {
      if (resumableSession) {
        setSession(resumableSession);
        setQuestions(resumableSession.sessionData.questions);
        setPhase('active');
        return;
      }

      const modulesWithoutConcepts = modules.filter(
        (mod) => !(mod.knowledgeMap?.concepts?.length),
      );
      if (modulesWithoutConcepts.length) {
        throw new Error(
          `Cannot generate diagnostic — missing concepts for: ${modulesWithoutConcepts.map((m) => m.name).join(', ')}`,
        );
      }

      const activity = diagnosticActivity ?? await ensureDiagnosticActivity(journeyId, activities);
      const priorKnowledge = journey?.priorKnowledge ?? 'some';

      const modulePayload = modules.map((mod) => ({
        moduleId: mod.moduleId,
        name: mod.name,
        description: mod.description,
        concepts: mod.knowledgeMap?.concepts ?? [],
      }));

      const interleaved = await runStudyAiGeneration({
        action: 'generateDiagnosticQuestions',
        generate: () => generateDiagnosticQuestionsProgressive({
          title: journey.title,
          subject: journey.subject,
          priorKnowledge,
          difficultyGuidance: difficultyGuidanceForPriorKnowledge(priorKnowledge),
          questionsPerModule: DIAGNOSTIC_QUESTIONS_PER_MODULE,
          modules: modulePayload,
        }, {
          onModule: (_mod, index, total) => {
            setModuleProgress({ index: index + 1, total });
          },
        }),
        normalize: (data) => {
          const rawQuestions = normalizeDiagnosticQuestions(
            data,
            modules,
            DIAGNOSTIC_QUESTIONS_PER_MODULE,
          );
          if (!rawQuestions.length) {
            throw new Error('AI returned no usable diagnostic questions. Try again in a moment.');
          }
          const validation = validateDiagnosticQuestions(rawQuestions, modules);
          if (!validation.valid) throw new Error(validation.message);
          return interleaveDiagnosticQuestions(rawQuestions, modules);
        },
      });

      const newSession = await createSession.mutateAsync({
        journeyId,
        input: {
          activityId: activity.activityId,
          activityType: 'diagnostic',
          startedAt: Date.now(),
          status: 'in_progress',
          sessionData: {
            diagnostic: true,
            questions: interleaved,
            quizConfig: DIAGNOSTIC_CONFIG,
            aiGeneration: { status: 'ready', completedAt: Date.now() },
          },
        },
      });

      setSession(newSession);
      setQuestions(interleaved);
      setPhase('active');
    } catch (err) {
      setGenError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      generatingRef.current = false;
      setGenerating(false);
    }
  };

  const handleExit = async () => {
    if (!session) {
      setPhase('intro');
      return;
    }
    try {
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: { status: 'abandoned' },
      });
      invalidateJourney();
    } catch {
      // best effort
    }
    setSession(null);
    setQuestions([]);
    setPhase('intro');
  };

  const handleComplete = async (answers, totalTimeSec) => {
    if (!session) return;

    const placement = computeDiagnosticPlacement(questions, answers, modules);
    const sessionData = {
      diagnostic: true,
      questions,
      answers,
      quizConfig: DIAGNOSTIC_CONFIG,
      placement,
    };

    setSummaryData({
      answers,
      totalTimeSec,
      moduleResults: placement.moduleResults,
    });
    setPhase('summary');

    try {
      await applyDiagnosticResults(journeyId, placement, session.sessionId);
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        patch: {
          status: 'completed',
          endedAt: Date.now(),
          durationSec: totalTimeSec,
          sessionData,
          score: placement.overallAccuracy,
          outcomeSummary: {
            accuracy: placement.overallAccuracy,
            itemsCompleted: answers.length,
            nextAction: `${placement.stageBCount} module(s) placed in Stage B`,
          },
        },
      });
      invalidateJourney();
    } catch (err) {
      toast.error(err.message || 'Could not save diagnostic results');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Diagnostic</h1>
        <LoginPrompt action="take the diagnostic assessment" />
      </div>
    );
  }

  if (journeyPending && !journey) {
    return <VeridianLoading fullPage />;
  }

  if (!journey) {
    return (
      <div className="diagnostic-page">
        <p className="journeys-error">Journey not found.</p>
        <Link to="/journeys" className="btn btn-primary">Back to journeys</Link>
      </div>
    );
  }

  if (resolvedPhase === 'done') {
    return <Navigate to={`/journeys/${journeyId}`} replace />;
  }

  if (resolvedPhase === 'skipped') {
    return <Navigate to={`/journeys/${journeyId}`} replace />;
  }

  if (resolvedPhase === 'summary' && summaryData) {
    return (
      <div className="diagnostic-page">
        <DiagnosticSummary
          questions={questions}
          answers={summaryData.answers}
          totalTimeSec={summaryData.totalTimeSec}
          journeyTitle={journey.title}
          moduleResults={summaryData.moduleResults}
          journeyId={journeyId}
        />
      </div>
    );
  }

  if (resolvedPhase === 'active' && questions.length) {
    return (
      <div className="diagnostic-page">
        <QuizRunner
          questions={questions}
          config={DIAGNOSTIC_CONFIG}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  if (generating) {
    const diagnosticStepIndex = moduleProgress
      ? Math.min(2, Math.floor(((moduleProgress.index - 1) / moduleProgress.total) * 3))
      : 0;
    const diagnosticProgressDetail = moduleProgress
      ? `Module ${moduleProgress.index} of ${moduleProgress.total}`
      : null;

    return (
      <div className="diagnostic-page">
        <AiGenerationLoading
          action="generateDiagnosticQuestions"
          activeStepIndex={diagnosticStepIndex}
          progressDetail={diagnosticProgressDetail}
        />
      </div>
    );
  }

  return (
    <div className="diagnostic-page">
      <Link to={`/journeys/${journeyId}`} className="journey-detail-back">← Journey</Link>

      {!activityReady && (
        <p className="diagnostic-setup-note">Setting up diagnostic…</p>
      )}

      {genError && (
        <StudyAiError
          message={genError?.message || 'Failed to generate diagnostic questions'}
          error={genError}
          onRetry={handleStart}
          retryLabel="Try again"
        />
      )}

      <DiagnosticIntro
        journeyTitle={journey.title}
        moduleCount={modules.length}
        questionCount={questionCount}
        onStart={handleStart}
        onSkip={handleSkip}
        loading={!activityReady}
        skipping={skipping}
        moduleProgress={moduleProgress}
      />
    </div>
  );
}
