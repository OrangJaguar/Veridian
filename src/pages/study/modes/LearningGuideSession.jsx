import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import LearningGuideViewer from '@/components/study/learning-guide/LearningGuideViewer';
import SessionSummary from '@/components/study/SessionSummary';
import { StudyAiLoading, StudyAiError } from '@/components/study/StudyAiStatus';
import { generateLearningGuide } from '@/api/ai/study';
import { sectionCountForConcepts } from '@/api/ai/prompts/learningGuide';
import { normalizeGuideContent } from '@/utils/study/normalizeGuideContent';
import { hasLearningGuideContent } from '@/utils/study/activityContent';
import { useStudyAiAutoGeneration } from '@/hooks/ai/useStudyAiGeneration';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useUpdateSession } from '@/hooks/mutations/useSessionMutations';
import { useJourney } from '@/hooks/queries/useJourneys';

export default function LearningGuideSession({ session, activity, module, journeyId }) {
  const { data: journey } = useJourney(journeyId);
  const guideReady = hasLearningGuideContent(activity);
  const [content, setContent] = useState(() => (
    guideReady ? activity.content : {}
  ));
  const [completedIds, setCompletedIds] = useState(
    () => activity.content?.progress?.completedSectionIds ?? [],
  );
  const [phase, setPhase] = useState('active');
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateActivity = useUpdateActivity();
  const updateSession = useUpdateSession();

  const sections = content.sections ?? [];
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;
  const moduleId = module?.moduleId;

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
    enabled: Boolean(moduleId && journey && !guideReady),
    hasContent: guideReady,
    beforeGenerate: markSessionGenerating,
    generate: async () => generateLearningGuide(buildPayload()),
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
      toast.error(err.message || 'Failed to generate learning guide');
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

  const handleExit = () => {
    window.speechSynthesis?.cancel();
    abandonSession({ sessionId: session.sessionId, journeyId, returnPath });
  };

  const handleSectionComplete = async (sectionId) => {
    const next = [...new Set([...completedIds, sectionId])];
    setCompletedIds(next);
    const nextContent = { ...content, progress: { completedSectionIds: next } };
    setContent(nextContent);
    await updateActivity.mutateAsync({
      activityId: activity.activityId,
      journeyId,
      moduleId,
      patch: { content: nextContent },
    });
  };

  const handleFinish = ({ checkInResults = {}, completedSectionIds = completedIds }) => {
    const checkInEntries = Object.entries(checkInResults).map(([sectionId, result]) => ({
      sectionId,
      ...result,
    }));

    setPhase('summary');
    completeSessionInBackground({
      sessionId: session.sessionId,
      journeyId,
      activityId: activity.activityId,
      activity,
      sessionData: {
        completedSectionIds,
        checkInResults: checkInEntries,
      },
      score: sections.length ? Math.round((completedSectionIds.length / sections.length) * 100) : 0,
      outcomeSummary: {
        itemsCompleted: completedSectionIds.length,
        nextAction: 'Begin Stage B practice',
      },
      startedAt: session.startedAt,
    });
  };

  if (isLoading) {
    return <StudyAiLoading label="Generating your learning guide…" />;
  }

  if (isError) {
    return (
      <StudyAiError
        message={error?.message || 'Failed to generate learning guide.'}
        onRetry={retry}
        onExit={handleExit}
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
      onSectionComplete={handleSectionComplete}
      onFinish={handleFinish}
      onExit={handleExit}
    />
  );
}
