import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useJourney } from '@/hooks/queries/useJourneys';
import { useModules } from '@/hooks/queries/useModules';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useSessions } from '@/hooks/queries/useSessions';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import { generateStudyPlan } from '@/utils/studyPlanner';
import { useAuth } from '@/hooks/useAuth';

export function useStudyPlan(journeyId) {
  const { isAuthenticated } = useAuth();
  const { data: journey } = useJourney(journeyId);
  const { data: modules = [] } = useModules(journeyId);
  const { data: activities = [] } = useActivitiesByJourney(journeyId);
  const { data: sessions = [] } = useSessions(journeyId);
  const { data: cards = [] } = useCardsByJourney(journeyId);

  return useQuery({
    queryKey: queryKeys.studyPlan(journeyId),
    queryFn: () => generateStudyPlan(journey, modules, activities, sessions, cards),
    enabled: isAuthenticated && !!journeyId && !!journey,
    staleTime: 30_000,
  });
}
