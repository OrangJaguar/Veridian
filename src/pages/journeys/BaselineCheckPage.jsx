import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { updateModule } from '@/api/entities/modules';
import { moduleNeedsBaseline } from '@/utils/research/baselineCheck';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { BaselineCheckIntro } from '@/pages/study/modes/BaselineCheckSession';
import { trackProductEvent } from '@/lib/analytics';

export default function BaselineCheckPage() {
  const { id: journeyId, moduleId } = useParams();
  const { data: journey, isPending: journeyPending } = useJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const launchStudy = useLaunchStudy();
  const [skipping, setSkipping] = useState(false);

  const module = modules.find((m) => m.moduleId === moduleId);
  const baselineActivity = activities.find(
    (a) => a.moduleId === moduleId && a.type === 'baselineCheck',
  );

  if (journeyPending && !journey) {
    return <VeridianLoading fullPage />;
  }

  if (!journey || !module) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Module not found</h1>
        <Link to={`/journeys/${journeyId}`} className="btn btn-primary">Back</Link>
      </div>
    );
  }

  if (!moduleNeedsBaseline(module)) {
    return <Navigate to={`/journeys/${journeyId}/modules/${moduleId}`} replace />;
  }

  const handleSkip = async () => {
    setSkipping(true);
    try {
      trackProductEvent('module_diagnostic_skip', { journeyId, moduleId });
      await updateModule(moduleId, { baselineSkipped: true });
    } finally {
      setSkipping(false);
    }
    window.location.href = `/journeys/${journeyId}/modules/${moduleId}`;
  };

  const handleStart = async () => {
    if (!baselineActivity) return;
    trackProductEvent('module_diagnostic_start', { journeyId, moduleId });
    await launchStudy({
      journeyId,
      activity: baselineActivity,
      moduleId,
      forceNew: true,
    });
  };

  return (
    <div className="baseline-check-page">
      <Link to={`/journeys/${journeyId}/modules/${moduleId}`} className="journey-detail-back">
        ← {module.name}
      </Link>
      <BaselineCheckIntro module={module} onStart={handleStart} onSkip={handleSkip} skipping={skipping} />
    </div>
  );
}
