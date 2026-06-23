import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listAllSessions } from '@/api/entities/sessions';
import { useRemoveStarterJourney } from '@/hooks/useRemoveStarterJourney';
import { countCompletedToday } from '@/utils/dueToday/completedToday';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import HomeWelcomeHeader from '@/components/home/HomeWelcomeHeader';
import HomeWelcomeBanner from '@/components/home/HomeWelcomeBanner';
import MaiDay60Banner from '@/components/home/MaiDay60Banner';
import HomeContextNotice from '@/components/home/HomeContextNotice';
import DueTodayZone from '@/components/home/DueTodayZone';
import HomeUpcomingSection from '@/components/home/HomeUpcomingSection';
import HomeExamCramZone from '@/components/home/HomeExamCramZone';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data: journeys = [], isPending: journeysPending } = useJourneys({ archived: false });
  const { data: dueItems = [], isPending: duePending } = useDueToday();
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.catalog.allSessions,
    queryFn: listAllSessions,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
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
  const plannedIds = dueItems.map((i) => i.activityId).filter((id) => !id.startsWith('fsrs-'));
  const completedToday = countCompletedToday(plannedIds, sessions);
  const cramJourneys = journeys.filter((j) => {
    if (!j.examDate) return false;
    const days = Math.ceil((j.examDate - Date.now()) / 86400000);
    return days >= 0 && days <= 7;
  });

  return (
    <div className="home-page">
      <HomeContextNotice dueItems={dueItems} journeys={journeys} />
      <HomeWelcomeBanner journeyCount={journeys.length} />
      <HomeWelcomeHeader />
      <MaiDay60Banner />
      {cramJourneys.length > 0 && <HomeExamCramZone journeys={cramJourneys} />}
      <DueTodayZone
        items={dueItems}
        loading={dueLoading}
        firstJourneyId={firstJourneyId}
        completedToday={completedToday}
      />
      <HomeUpcomingSection journeys={journeys} />
    </div>
  );
}
