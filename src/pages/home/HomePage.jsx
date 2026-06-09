import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useEnsureStarterJourney } from '@/hooks/useEnsureStarterJourney';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import HomeWelcomeHeader from '@/components/home/HomeWelcomeHeader';
import DueTodayZone from '@/components/home/DueTodayZone';
import JourneyGridZone from '@/components/home/JourneyGridZone';
import HomeExamCramZone from '@/components/home/HomeExamCramZone';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [], isLoading: journeysLoading } = useJourneys({ archived: false });
  const { data: dueItems = [], isLoading: dueLoading } = useDueToday();
  const { provisioning, error: provisionError } = useEnsureStarterJourney();

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">App Home</h1>
        <p className="stub-description">
          Due Today, your Journey grid, and the action-driven home screen.
        </p>
        <LoginPrompt action="save your progress and sync across devices" />
      </div>
    );
  }

  if (journeysLoading || provisioning || (!journeysLoading && journeys.length === 0)) {
    return (
      <div className="home-page">
        <p className="journeys-status">
          {provisionError ? 'Could not load your starter journey. Please refresh.' : 'Setting up your first journey…'}
        </p>
      </div>
    );
  }

  const firstJourneyId = journeys[0]?.journeyId;

  return (
    <div className="home-page">
      <HomeWelcomeHeader />
      <HomeExamCramZone journeys={journeys} />
      <DueTodayZone
        items={dueItems}
        loading={dueLoading || journeysLoading}
        firstJourneyId={firstJourneyId}
      />
      <JourneyGridZone />
    </div>
  );
}
