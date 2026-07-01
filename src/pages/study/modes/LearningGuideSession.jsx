import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import LearningGuideViewer from '@/components/study/learning-guide/LearningGuideViewer';
import SessionSummary from '@/components/study/SessionSummary';
import { StudyAiError } from '@/components/study/StudyAiStatus';
import AiGenerationLoading from '@/components/shared/AiGenerationLoading';
import StudyAiRawPanel from '@/components/study/StudyAiRawPanel';
import { fetchGeminiStudyRaw } from '@/api/ai/study';
import { generateLearningGuideProgressive } from '@/utils/study/generateLearningGuideProgressive';
import { sectionCountForConcepts } from '@/api/ai/prompts/learningGuide';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';
import {
  hasLearningGuideContent,
  resolveGuideSectionIndex,
  resolveGuideCheckIns,
} from '@/utils/study/activityContent';
import { useStudyAiAutoGeneration } from '@/hooks/ai/useStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useJourney } from '@/hooks/queries/useJourneys';
import { queryKeys } from '@/api/query-keys';
import { isRawDumpEnabled, getLastRawGemini } from '@/utils/study/studyAiTrace';

export default function LearningGuideSession({ session, activity, module, journeyId }) {
  const rawDumpMode = isRawDumpEnabled();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: journey } = useJourney(journeyId);
  const guideReady = activity?.status === 'ready' && hasLearningGuideContent(activity);
  const [content, setContent] = useState(() => (
    guideReady ? activity.content : {}
  ));
  const [completedIds, setCompletedIds] = useState(
    () => activity.content?.progress?.completedSectionIds ?? session.sessionData?.completedSectionIds ?? [],
  );
  const [phase, setPhase] = useState('active');
  const [rawText, setRawText] = useState(null);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawError, setRawError] = useState(null);
  const [sectionProgress, setSectionProgress] = useState(null);
  const progressRef = useRef({
    sectionIndex: resolveGuideSectionIndex(
      activity.content?.sections ?? [],
      activity.content?.progress,
      session.sessionData,
    ),
    checkInBySection: resolveGuideCheckIns(activity.content?.progress, session.sessionData),
    completedSectionIds: activity.content?.progress?.completedSectionIds ?? [],
  });
  const { completeSessionInBackground } = useCompleteSession();
  const updateActivity = useUpdateActivity();
  const updateSession = useUpdateSession();
  const activityRef = useRef(activity);
  activityRef.current = activity;

  const sections = content.sections ?? [];
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;
  const moduleId = module?.moduleId;

  const initialSectionIndex = resolveGuideSectionIndex(
    sections,
    activity.content?.progress,
    session.sessionData,
  );
  const initialCheckInBySection = resolveGuideCheckIns(
    activity.content?.progress,
    session.sessionData,
  );

  useEffect(() => {
    if (activity.content?.sections?.length) {
      setContent(activity.content);
    }
  }, [activity.content]);

  const buildPayload = useCallback(() => {
    const concepts = module?.knowledgeMap?.concepts ?? [];
    return {
      moduleName: module?.name,
      moduleDescription: module?.description,
      concepts,
      subject: journey?.subject ?? 'General',
      priorKnowledge: journey?.priorKnowledge ?? 'some',
      sectionCount: sectionCountForConcepts(concepts),
    };
  }, [journey?.priorKnowledge, journey?.subject, module]);

  useEffect(() => {
    if (!rawDumpMode || !moduleId || !journey || guideReady) return undefined;

    let cancelled = false;
    setRawLoading(true);
    setRawError(null);

    fetchGeminiStudyRaw('generateLearningGuide', buildPayload())
      .then((result) => {
        if (cancelled) return;
        setRawText(result?.rawGeminiText ?? getLastRawGemini());
      })
      .catch((err) => {
        if (cancelled) return;
        setRawError(err instanceof Error ? err : new Error(String(err)));
        const captured = getLastRawGemini();
        if (captured) setRawText(captured);
      })
      .finally(() => {
        if (!cancelled) setRawLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rawDumpMode, moduleId, journey, guideReady, buildPayload]);

  const markSessionGenerating = useCallback(async () => {
    await updateSession.mutateAsync({
      sessionId: session.sessionId,
      journeyId,
      skipInvalidate: true,
      patch: {
        sessionData: {
          ...session.sessionData,
          aiGeneration: { status: 'generating', startedAt: Date.now() },
        },
      },
    });
  }, [journeyId, session.sessionData, session.sessionId, updateSession]);

  const { isLoading, isError, error, retry } = useStudyAiAutoGeneration({
    action: 'generateLearningGuide',
    enabled: Boolean(moduleId && journey && !guideReady) && !rawDumpMode,
    hasContent: guideReady,
    beforeGenerate: markSessionGenerating,
    generate: async () => {
      const payload = buildPayload();
      const targetCount = payload.sectionCount;
      const savedSections = activityRef.current.content?.sections ?? [];
      const existingSections = savedSections.length > 0 && savedSections.length < targetCount
        ? savedSections
        : [];

      if (existingSections.length > 0) {
        setSectionProgress({ current: existingSections.length, total: targetCount });
      }

      return generateLearningGuideProgressive(payload, {
        existingSections,
        onSection: async (_section, index, total, allSections) => {
          setSectionProgress({ current: index + 1, total });
          const partial = normalizeGuideContent({
            sections: allSections,
            estimatedMinutes: Math.max(8, allSections.length * 5),
          });
          await updateActivity.mutateAsync({
            activityId: activity.activityId,
            journeyId,
            moduleId,
            patch: {
              status: 'generating',
              content: partial,
              itemCount: allSections.length,
            },
          });
        },
      });
    },
    normalize: normalizeGuideContent,
    validate: (normalized) => {
      if (!normalized?.sections?.length) {
        throw new Error('AI returned an empty learning guide.');
      }
    },
    persist: async (normalized) => {
      await updateActivity.mutateAsync({
        activityId: activity.activityId,
        journeyId,
        moduleId,
        patch: {
          status: 'ready',
          content: normalized,
          itemCount: normalized.sections.length,
        },
      });
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            aiGeneration: { status: 'ready', completedAt: Date.now() },
          },
        },
      });
    },
    onSuccess: (normalized) => setContent(normalized),
    onError: async (err) => {
      await updateActivity.mutateAsync({
        activityId: activity.activityId,
        journeyId,
        moduleId,
        patch: { status: 'failed' },
      }).catch(() => {});
      await updateSession.mutateAsync({
        sessionId: session.sessionId,
        journeyId,
        skipInvalidate: true,
        patch: {
          sessionData: {
            ...session.sessionData,
            aiGeneration: { status: 'failed', message: err.message, failedAt: Date.now() },
          },
        },
      }).catch(() => {});
    },
  });

  const persistGuideProgress = useCallback(async (snapshot) => {
    const {
      sectionIndex,
      checkInBySection = {},
      completedSectionIds = completedIds,
    } = snapshot;

    const nextContent = {
      ...content,
      progress: {
        completedSectionIds,
        currentSectionIndex: sectionIndex,
        checkInBySection,
      },
    };

    setContent(nextContent);
    setCompletedIds(completedSectionIds);

    await updateActivity.mutateAsync({
      activityId: activity.activityId,
      journeyId,
      moduleId,
      patch: { content: nextContent },
    });

    await updateSession.mutateAsync({
      sessionId: session.sessionId,
      journeyId,
      skipInvalidate: true,
      patch: {
        status: 'in_progress',
        sessionData: {
          ...session.sessionData,
          currentSectionIndex: sectionIndex,
          completedSectionIds,
          checkInBySection,
        },
      },
    });

    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byModule(moduleId) });
  }, [
    activity.activityId,
    completedIds,
    content,
    journeyId,
    moduleId,
    queryClient,
    session.sessionData,
    session.sessionId,
    updateActivity,
    updateSession,
  ]);

  const handleProgressChange = useCallback((snapshot) => {
    progressRef.current = snapshot;
  }, []);

  const handleExit = async () => {
    window.speechSynthesis?.cancel();
    try {
      await persistGuideProgress(progressRef.current);
    } catch {
      // still leave
    }
    navigate(returnPath);
  };

  const handleSectionComplete = async (sectionId, snapshot) => {
    const next = snapshot?.completedSectionIds
      ?? [...new Set([...completedIds, sectionId])];
    setCompletedIds(next);
    progressRef.current = {
      sectionIndex: snapshot?.sectionIndex ?? progressRef.current.sectionIndex,
      checkInBySection: snapshot?.checkInBySection ?? progressRef.current.checkInBySection,
      completedSectionIds: next,
    };
    await persistGuideProgress(progressRef.current);
  };

  const handleFinish = async ({ checkInResults = {}, completedSectionIds: finishedIds = completedIds }) => {
    const allSectionIds = sections.map((s) => s.sectionId);
    const checkInBySection = checkInResults;

    const nextContent = {
      ...content,
      progress: {
        completedSectionIds: allSectionIds,
        currentSectionIndex: 0,
        checkInBySection,
      },
    };

    setCompletedIds(allSectionIds);
    setContent(nextContent);

    await updateActivity.mutateAsync({
      activityId: activity.activityId,
      journeyId,
      moduleId,
      patch: { content: nextContent },
    });

    const checkInEntries = Object.entries(checkInBySection).map(([sectionId, result]) => ({
      sectionId,
      ...result,
    }));

    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity: { ...activity, content: nextContent },
      sessionData: {
        completedSectionIds: allSectionIds,
        checkInResults: checkInEntries,
        checkInBySection,
      },
      score: sections.length ? 100 : 0,
      outcomeSummary: {
        itemsCompleted: allSectionIds.length,
        nextAction: 'Begin Stage B practice',
      },
      startedAt: session.startedAt,
    });
  };

  if (rawDumpMode) {
    if (rawLoading) {
      return (
        <AiGenerationLoading
          action="rawGeminiDump"
          className="study-mode-view guide-mode-view guide-mode-view--loading"
        />
      );
    }
    if (rawText) {
      return (
        <StudyAiRawPanel
          text={rawText}
          title="Learning guide — raw Gemini dump"
          onExit={handleExit}
        />
      );
    }
    if (rawError) {
      return (
        <StudyAiError
          message={rawError.message || 'Raw dump request failed.'}
          error={rawError}
          onExit={handleExit}
        />
      );
    }
  }

  if (isLoading) {
    const totalSteps = 4;
    const guideStepIndex = sectionProgress
      ? Math.min(
        totalSteps - 1,
        Math.floor((sectionProgress.current / sectionProgress.total) * totalSteps),
      )
      : 0;
    const guideProgressDetail = sectionProgress
      ? `Section ${sectionProgress.current} of ${sectionProgress.total}`
      : null;

    return (
      <AiGenerationLoading
        action="generateLearningGuide"
        className="study-mode-view guide-mode-view guide-mode-view--loading"
        activeStepIndex={guideStepIndex}
        progressDetail={guideProgressDetail}
      />
    );
  }

  if (isError) {
    const savedSections = activityRef.current.content?.sections?.length ?? 0;
    const targetSections = sectionCountForConcepts(module?.knowledgeMap?.concepts ?? []);
    return (
      <StudyAiError
        message={error?.message || 'Failed to generate learning guide.'}
        error={error}
        progress={savedSections > 0
          ? { completed: savedSections, total: targetSections, label: 'sections' }
          : null}
        onRetry={retry}
        onExit={handleExit}
        retryLabel="Continue generating"
      />
    );
  }

  if (phase === 'summary') {
    return (
      <SessionSummary
        title="Learning Guide complete"
        stats={[{ label: 'Sections completed', value: completedIds.length }]}
        nextAction="You're ready to start Stage B practice."
        returnHref={returnPath}
      />
    );
  }

  if (!sections.length) {
    return (
      <StudyAiError
        message="This learning guide could not be loaded."
        onExit={handleExit}
        exitLabel="Go back"
      />
    );
  }

  return (
    <LearningGuideViewer
      sections={sections}
      completedIds={completedIds}
      initialSectionIndex={initialSectionIndex}
      initialCheckInBySection={initialCheckInBySection}
      onSectionComplete={handleSectionComplete}
      onFinish={handleFinish}
      onExit={handleExit}
      onProgressChange={handleProgressChange}
    />
  );
}
