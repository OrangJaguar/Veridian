import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import {
  listActivitiesByModule,
  listActivitiesByJourney,
  getActivity,
} from '@/api/entities/activities';
import { useAuth } from '@/hooks/useAuth';

export function useActivities(moduleId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.activities.byModule(moduleId),
    queryFn: () => listActivitiesByModule(moduleId),
    enabled: isAuthenticated && !!moduleId,
    staleTime: 30_000,
  });
}

export function useActivitiesByJourney(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.activities.byJourney(journeyId),
    queryFn: () => listActivitiesByJourney(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: 30_000,
  });
}

export function useActivity(activityId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['activities', 'detail', activityId],
    queryFn: () => getActivity(activityId),
    enabled: isAuthenticated && !!activityId,
    staleTime: 30_000,
  });
}
