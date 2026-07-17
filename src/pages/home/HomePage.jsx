import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listAllSessions } from '@/api/entities/sessions';
import { useRemoveStarterJourney } from '@/hooks/useRemoveStarterJourney';
import { countCompletedToday } from '@/utils/dueToday/completedToday';
import { isExamWeek } from '@/utils/weeklyPlan/weekKey';
import { resolveJourneyPacingMode } from '@/utils/planner/pacingMode';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import HomeWelcomeHeader from '@/components/home/HomeWelcomeHeader';
import MaiDay60Banner from '@/components/home/MaiDay60Banner';
import HomeContextNotice from '@/components/home/HomeContextNotice';
import DueTodayZone from '@/components/home/DueTodayZone';
import WeeklyCommitmentCard from '@/components/home/WeeklyCommitmentCard';
import HomeUpcomingSection from '@/components/home/HomeUpcomingSection';
import HomeExamCramZone from '@/components/home/HomeExamCramZone';
import HomeKeepSharpZone from '@/components/home/HomeKeepSharpZone';
import HomeEmptyState from '@/components/home/HomeEmptyState';
import HomeFirstSessionReady from '@/components/home/HomeFirstSessionReady';
import MaiSurveyPromptModal from '@/components/survey/MaiSurveyPromptModal';
import { useMaiSurveyEligibility } from '@/hooks/useMaiSurveyEligibility';
import { Link } from 'react-router-dom';


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
  const { eligible: maiEligible } = useMaiSurveyEligibility();
  const [maiModalOpen, setMaiModalOpen] = useState(false);

  useEffect(() => {
    if (maiEligible) setMaiModalOpen(true);
  }, [maiEligible]);

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

  const hasProcessing = journeys.some((j) => j.generationStatus === 'processing');
  const showEmpty = journeys.length === 0 && !hasProcessing;

  const firstJourneyId = journeys.find((j) => j.generationStatus === 'completed')?.journeyId
    ?? journeys[0]?.journeyId;
  const dueLoading = duePending && dueItems.length === 0;
  const plannedIds = dueItems.map((i) => i.activityId).filter((id) => !id.startsWith('fsrs-'));
  const completedToday = countCompletedToday(plannedIds, sessions);
  const examWeekJourneys = journeys.filter((j) => isExamWeek(j.examDate));
  const keepSharpJourneys = journeys.filter(
    (j) => resolveJourneyPacingMode(j.examDate) === 'keepSharp',
  );
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const focusItem = dueItems.find((i) => i.tier === 'focus') ?? dueItems[0] ?? null;
  const hasReadyJourney = journeys.some(
    (j) => j.generationStatus === 'completed' || (!j.generationStatus && j.journeyId),
  );
  const showFirstSessionReady = hasReadyJourney
    && !hasProcessing
    && Boolean(focusItem)
    && completedSessions <= 2;

  if (showEmpty) {
    return (
      <div className="home-page">
        <MaiSurveyPromptModal open={maiModalOpen && maiEligible} onClose={() => setMaiModalOpen(false)} />
        <HomeEmptyState />
      </div>
    );
  }

  return (
    <div className="home-page">
      <MaiSurveyPromptModal open={maiModalOpen && maiEligible} onClose={() => setMaiModalOpen(false)} />
      <HomeContextNotice dueItems={dueItems} journeys={journeys} />
      {journeys.length > 0 && <HomeWelcomeHeader />}
      <MaiDay60Banner />
      {showFirstSessionReady && (
        <HomeFirstSessionReady
          focusItem={focusItem}
          completedSessionCount={completedSessions}
        />
      )}
      <DueTodayZone
        items={dueItems}
        loading={dueLoading}
        firstJourneyId={firstJourneyId}
        completedToday={completedToday}
        journeys={journeys}
      />
      {journeys.length > 0 && <WeeklyCommitmentCard />}
      <div className="home-mistakes-link-row">
        <Link to="/mistakes" className="home-mistakes-link">Review Mistakes →</Link>
      </div>
      {examWeekJourneys.length > 0 && <HomeExamCramZone journeys={examWeekJourneys} />}
      {keepSharpJourneys.length > 0 && <HomeKeepSharpZone journeys={keepSharpJourneys} />}
      <HomeUpcomingSection journeys={journeys} />
    </div>
  );
}
