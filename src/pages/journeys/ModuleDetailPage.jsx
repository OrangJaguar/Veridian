import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivities } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import DetailBackButton from '@/components/shared/DetailBackButton';
import ModuleDetailHeader from '@/components/module-detail/ModuleDetailHeader';
import StageSection from '@/components/module-detail/StageSection';
import FlashcardDeckList from '@/components/module-detail/FlashcardDeckList';
import SessionHistoryPanel from '@/components/module-detail/SessionHistoryPanel';
import { useRecoverStaleGeneratingActivities } from '@/hooks/useRecoverStaleGeneratingActivities';
import { moduleNeedsBaseline } from '@/utils/research/baselineCheck';

export default function ModuleDetailPage() {
  const { id: journeyId, moduleId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data: journey, isPending: journeyPending } = useJourney(journeyId);
  const { data: modules = [], isPending: modulesPending } = useModules(journeyId);
  const { data: activities = [] } = useActivities(moduleId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: journeyCards = [] } = useCardsByJourney(journeyId);

  const mod = modules.find((m) => m.moduleId === moduleId);
  const flashcardDecks = activities.filter((a) => a.type === 'flashcardSet');
  const recommendedStage = mod?.stage || 'A';
  const waitingForCore = (journeyPending && !journey) || (modulesPending && !mod);

  useRecoverStaleGeneratingActivities(journeyId, activities, sessions);

  const cardsByActivity = {};
  for (const card of journeyCards) {
    if (!cardsByActivity[card.activityId]) cardsByActivity[card.activityId] = [];
    cardsByActivity[card.activityId].push(card);
  }

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Module Detail</h1>
        <LoginPrompt action="study this module" />
      </div>
    );
  }

  if (waitingForCore) {
    return <VeridianLoading fullPage />;
  }

  if (!journey || !mod) {
    return (
      <div className="module-detail-page">
        <DetailBackButton to={`/journeys/${journeyId}`} label="Journey" />
        <p className="journeys-error">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="module-detail-page">
      <ModuleDetailHeader module={mod} journey={journey} journeyId={journeyId} />

      {moduleNeedsBaseline(mod) && (
        <div className="module-diagnostic-prompt">
          <div>
            <h3 className="module-diagnostic-prompt-title">Know this already?</h3>
            <p className="module-diagnostic-prompt-body">
              Take an optional 3-question check and Veridian will place this module at the
              right starting stage. You can study without it.
            </p>
          </div>
          <Link
            to={`/journeys/${journeyId}/modules/${moduleId}/baseline`}
            className="btn btn-secondary btn-sm"
          >
            Take the quick check
          </Link>
        </div>
      )}

      {['A', 'B', 'C'].map((stage) => (
        <StageSection
          key={stage}
          stage={stage}
          recommendedStage={recommendedStage}
          activities={activities}
          cardsByActivity={cardsByActivity}
          journeyId={journeyId}
          moduleId={moduleId}
        />
      ))}

      <FlashcardDeckList
        decks={flashcardDecks}
        cardsByActivity={cardsByActivity}
        moduleId={moduleId}
        journeyId={journeyId}
        knowledgeMap={mod.knowledgeMap}
      />
      <SessionHistoryPanel sessions={sessions.filter((s) => s.moduleId === moduleId)} />
    </div>
  );
}
