import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useRemoveStarterJourney } from '@/hooks/useRemoveStarterJourney';
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
  useRemoveStarterJourney();

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
