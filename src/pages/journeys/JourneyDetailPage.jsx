import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useStudyPlan } from '@/hooks/queries/useStudyPlan';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import JourneyDetailSkeleton from '@/components/journeys/JourneyDetailSkeleton';
import JourneyDetailHeader from '@/components/journey-detail/JourneyDetailHeader';
import JourneyDetailGuideBanner from '@/components/journey-detail/JourneyDetailGuideBanner';
import VeridianCertifiedBanner from '@/components/journeys/VeridianCertifiedBanner';
import JourneySharingPanel from '@/components/journey-detail/JourneySharingPanel';
import RecommendedStudyPlan from '@/components/journey-detail/RecommendedStudyPlan';
import ModuleListItem from '@/components/journey-detail/ModuleListItem';
import JourneyLevelActions from '@/components/journey-detail/JourneyLevelActions';
import JourneyDetailActions from '@/components/journey-detail/JourneyDetailActions';
import JourneyInsightsPanel from '@/components/journey-detail/JourneyInsightsPanel';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { useRecoverStaleGeneratingActivities } from '@/hooks/useRecoverStaleGeneratingActivities';

export default function JourneyDetailPage() {
  const { id: journeyId } = useParams();
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const { isAuthenticated } = useAuth();
  const { data: journey, isPending, error } = useJourney(journeyId);
  const { data: modules = [], isPending: modulesPending } = useModules(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: cards = [] } = useCardsByJourney(journeyId);
  const { data: plan, isLoading: planLoading } = useStudyPlan(journeyId);

  useRecoverStaleGeneratingActivities(journeyId, activities, sessions);

  const cardsByActivity = {};
  for (const card of cards) {
    if (!cardsByActivity[card.activityId]) cardsByActivity[card.activityId] = [];
    cardsByActivity[card.activityId].push(card);
  }

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Journey Detail</h1>
        <LoginPrompt action="view and edit this Journey" />
      </div>
    );
  }

  if (isPending && !journey) {
    return <JourneyDetailSkeleton />;
  }

  if (error || !journey) {
    return (
      <div className="journey-detail-page">
        <p className="journeys-error">{error?.message || 'Journey not found.'}</p>
      </div>
    );
  }

  return (
    <div className="journey-detail-page">
      <JourneyDetailHeader journey={journey} modules={modules} />
      <VeridianCertifiedBanner journey={journey} />
      <JourneyDetailGuideBanner />

      <JourneySharingPanel journey={journey} />

      <section className="journey-detail-modules detail-section-box">
        <h2 className="journey-detail-section-title">Modules</h2>
        {modulesPending && modules.length === 0 && <VeridianLoading size="sm" />}
        {!modulesPending && modules.length === 0 && (
          <p className="journey-detail-empty">No modules yet.</p>
        )}
        <ul className="journey-module-list">
          {modules.map((mod) => (
            <ModuleListItem
              key={mod.moduleId ?? mod.id}
              journeyId={journeyId}
              module={mod}
              activities={activities}
              cardsByActivity={cardsByActivity}
              expanded={expandedModuleId === mod.moduleId}
              onToggle={() => setExpandedModuleId(
                expandedModuleId === mod.moduleId ? null : mod.moduleId,
              )}
            />
          ))}
        </ul>
      </section>

      <RecommendedStudyPlan plan={plan} loading={planLoading} />

      <JourneyDetailActions journey={journey} />

      <JourneyLevelActions
        activities={activities}
        modules={modules}
        journeyId={journeyId}
        journey={journey}
      />

      <JourneyInsightsPanel sessions={sessions} modules={modules} />
    </div>
  );
}