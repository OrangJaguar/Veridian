import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import VeridianLoading from '@/components/shared/VeridianLoading';
import LearningGuideViewer from '@/components/study/learning-guide/LearningGuideViewer';
import SessionSummary from '@/components/study/SessionSummary';
import { useCompleteSession } from '@/hooks/study/useCompleteSession';
import { useAbandonSession } from '@/hooks/study/useAbandonSession';
import { useUpdateActivity } from '@/hooks/mutations/useActivityMutations';
import { useSyncStarterLearningGuide } from '@/hooks/useSyncStarterLearningGuide';

export default function LearningGuideSession({ session, activity, module, journeyId }) {
  const [content, setContent] = useState(activity.content ?? {});
  const [completedIds, setCompletedIds] = useState(content.progress?.completedSectionIds ?? []);
  const [loading, setLoading] = useState(
    !activity.content?.sections?.length
      && (activity.status === 'notGenerated' || activity.status === 'generating'),
  );
  const [phase, setPhase] = useState('active');
  const { completeSessionInBackground } = useCompleteSession();
  const abandonSession = useAbandonSession();
  const updateActivity = useUpdateActivity();
  useSyncStarterLearningGuide();

  const sections = content.sections ?? [];
  const returnPath = `/journeys/${journeyId}/modules/${module?.moduleId}`;

  useEffect(() => {
    if (activity.content?.sections?.length) {
      setContent(activity.content);
    }
  }, [activity.content]);

  useEffect(() => {
    if (activity.status === 'ready' && (activity.content?.sections?.length || content.sections?.length)) {
      setLoading(false);
      return;
    }
    if (activity.status !== 'notGenerated' && activity.status !== 'generating') return;

    (async () => {
      try {
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'generating' },
        });
        toast.error('Learning guide not available. Open a module with a pre-loaded guide.');
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'failed' },
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load guide');
        await updateActivity.mutateAsync({
          activityId: activity.activityId,
          journeyId,
          moduleId: module?.moduleId,
          patch: { status: 'failed' },
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      moduleId: module?.moduleId,
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

  if (loading) {
    return (
      <div className="study-mode-view guide-mode-view guide-mode-view--loading">
        <VeridianLoading fullPage />
      </div>
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
      <div className="study-mode-view guide-mode-view">
        <div className="guide-empty">
          <p>This learning guide has no sections yet.</p>
          <button type="button" className="btn btn-primary" onClick={handleExit}>Go back</button>
        </div>
      </div>
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
