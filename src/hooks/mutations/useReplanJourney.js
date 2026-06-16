import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rebuildWeeklyPlan, invalidateWeeklyPlan } from '@/api/entities/weeklyPlan';
import { queryKeys } from '@/api/query-keys';

export function useReplanJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId) => rebuildWeeklyPlan(journeyId, { force: true }),
    onSuccess: (_snapshot, journeyId) => {
      invalidateWeeklyPlan(queryClient, journeyId);
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
      toast.success('Study plan updated');
    },
    onError: () => {
      toast.error('Could not rebuild study plan');
    },
  });
}
