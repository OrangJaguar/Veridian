import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useEnsureStarterJourney } from '@/hooks/useEnsureStarterJourney';
import { useSyncStarterLearningGuide } from '@/hooks/useSyncStarterLearningGuide';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import HomeWelcomeHeader from '@/components/home/HomeWelcomeHeader';
import HomeContextNotice from '@/components/home/HomeContextNotice';
import DueTodayZone from '@/components/home/DueTodayZone';
import HomeUpcomingSection from '@/components/home/HomeUpcomingSection';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [], isPending: journeysPending } = useJourneys({ archived: false });
  const { data: dueItems = [], isPending: duePending } = useDueToday();
  const { provisioning, error: provisionError } = useEnsureStarterJourney();
  useSyncStarterLearningGuide();

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">App Home</h1>
        <p className="stub-description">
          Your focused study home — one clear next step, every time you open the app.
        </p>
        <LoginPrompt action="save your progress and sync across devices" />
      </div>
    );
  }

  if (provisionError) {
    return (
      <div className="home-page">
        <p className="journeys-status">Could not load your starter journey. Please refresh.</p>
      </div>
    );
  }

  if (provisioning) {
    return <VeridianLoading fullPage label="Setting up your first journey" />;
  }

  if (journeysPending && journeys.length === 0) {
    return <VeridianLoading fullPage />;
  }

  const firstJourneyId = journeys[0]?.journeyId;
  const dueLoading = duePending && dueItems.length === 0;

  return (
    <div className="home-page">
      <HomeContextNotice dueItems={dueItems} journeys={journeys} />
      <HomeWelcomeHeader />
      <DueTodayZone
        items={dueItems}
        loading={dueLoading}
        firstJourneyId={firstJourneyId}
      />
      <HomeUpcomingSection journeys={journeys} />
    </div>
  );
}
