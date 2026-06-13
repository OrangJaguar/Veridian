import { useParams } from 'react-router-dom';
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
import { useRecoverStaleGeneratingActivities } from '@/hooks/useRecoverStaleGeneratingActivities';

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
