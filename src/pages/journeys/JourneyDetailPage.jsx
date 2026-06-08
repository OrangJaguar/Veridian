import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useStudyPlan } from '@/hooks/queries/useStudyPlan';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import JourneyDetailHeader from '@/components/journey-detail/JourneyDetailHeader';
import RecommendedStudyPlan from '@/components/journey-detail/RecommendedStudyPlan';
import ModuleListItem from '@/components/journey-detail/ModuleListItem';
import JourneyLevelActions from '@/components/journey-detail/JourneyLevelActions';
import JourneyInsightsPanel from '@/components/journey-detail/JourneyInsightsPanel';

export default function JourneyDetailPage() {
  const { id: journeyId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data: journey, isLoading, error } = useJourney(journeyId);
  const { data: modules = [], isLoading: modulesLoading } = useModules(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: plan, isLoading: planLoading } = useStudyPlan(journeyId);

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Journey Detail</h1>
        <LoginPrompt action="view and edit this Journey" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="journey-detail-page">
        <p className="journeys-status">Loading Journey…</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="journey-detail-page">
        <Link to="/journeys" className="journey-detail-back">← Journeys</Link>
        <p className="journeys-error">{error?.message || 'Journey not found.'}</p>
      </div>
    );
  }

  return (
    <div className="journey-detail-page">
      <Link to="/journeys" className="journey-detail-back">← Journeys</Link>

      <JourneyDetailHeader journey={journey} modules={modules} />
      <RecommendedStudyPlan plan={plan} loading={planLoading} />

      <section className="journey-detail-modules">
        <h2 className="journey-detail-section-title">Modules</h2>
        {modulesLoading && <p className="journeys-status">Loading modules…</p>}
        {!modulesLoading && modules.length === 0 && (
          <p className="journey-detail-empty">No modules yet.</p>
        )}
        <ul className="journey-module-list">
          {modules.map((mod) => (
            <ModuleListItem
              key={mod.moduleId ?? mod.id}
              journeyId={journeyId}
              module={mod}
              sessions={sessions}
            />
          ))}
        </ul>
      </section>

      <JourneyLevelActions activities={activities} modules={modules} />
      <JourneyInsightsPanel sessions={sessions} />
    </div>
  );
}
