import { listJourneys } from '@/api/entities/journeys';
import { listAllModules } from '@/api/entities/modules';
import { listAllActivities } from '@/api/entities/activities';
import { listAllCards } from '@/api/entities/cards';
import { listAllSessions } from '@/api/entities/sessions';
import { queryKeys } from '@/api/query-keys';
import { getDueTodayItems } from '@/utils/dueToday/getDueTodayItems';

/**
 * Build Due Today from shared React Query cache when possible.
 */
export async function fetchDueTodayItems(queryClient) {
  const [journeys, modules, activities, cards, sessions] = await Promise.all([
    queryClient.ensureQueryData({
      queryKey: queryKeys.journeys.all,
      queryFn: () => listJourneys({ archived: false }),
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.catalog.allModules,
      queryFn: listAllModules,
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.catalog.allActivities,
      queryFn: listAllActivities,
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.catalog.allCards,
      queryFn: listAllCards,
    }),
    queryClient.ensureQueryData({
      queryKey: queryKeys.catalog.allSessions,
      queryFn: listAllSessions,
    }),
  ]);

  return getDueTodayItems({ journeys, modules, activities, sessions, cards });
}
