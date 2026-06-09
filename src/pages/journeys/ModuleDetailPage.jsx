import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivities } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import ModuleDetailHeader from '@/components/module-detail/ModuleDetailHeader';
import StageSection from '@/components/module-detail/StageSection';
import FlashcardDeckList from '@/components/module-detail/FlashcardDeckList';
import SessionHistoryPanel from '@/components/module-detail/SessionHistoryPanel';
import ConceptMapPanel from '@/components/module-detail/ConceptMapPanel';

export default function ModuleDetailPage() {
  const { id: journeyId, moduleId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data: journey, isLoading: journeyLoading } = useJourney(journeyId);
  const { data: modules = [], isLoading: modulesLoading } = useModules(journeyId);
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(moduleId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: journeyCards = [] } = useCardsByJourney(journeyId);

  const mod = modules.find((m) => m.moduleId === moduleId);
  const flashcardDecks = activities.filter((a) => a.type === 'flashcardSet');
  const recommendedStage = mod?.stage || 'A';

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

  const loading = journeyLoading || modulesLoading || activitiesLoading;

  if (loading) {
    return (
      <div className="module-detail-page">
        <p className="journeys-status">Loading module…</p>
      </div>
    );
  }

  if (!journey || !mod) {
    return (
      <div className="module-detail-page">
        <Link to={`/journeys/${journeyId}`} className="journey-detail-back">← Journey</Link>
        <p className="journeys-error">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="module-detail-page">
      <Link to={`/journeys/${journeyId}`} className="journey-detail-back">← {journey.title}</Link>

      <ModuleDetailHeader module={mod} journey={journey} />

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
      <ConceptMapPanel knowledgeMap={mod.knowledgeMap} />
    </div>
  );
}
