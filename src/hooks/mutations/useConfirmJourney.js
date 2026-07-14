import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { queryKeys } from '@/api/query-keys';
import { confirmJourney } from '@/api/entities/confirmJourney';
import { dismissHomeWelcomeHint } from '@/utils/preferences/dismissHomeWelcomeHint';
import { useAuth } from '@/hooks/useAuth';

function invalidateAll(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.archived });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
  queryClient.invalidateQueries({ queryKey: ['library'] });
  if (journeyId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
  }
}

export function useConfirmJourney() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  return useMutation({
    mutationFn: confirmJourney,
    onSuccess: async ({ journey, publishBlocked, publishBlockReason }) => {
      await dismissHomeWelcomeHint(queryClient, user?.email);
      invalidateAll(queryClient, journey.journeyId);
      if (publishBlocked) {
        toast.warning(
          publishBlockReason
            || 'Your journey was saved privately because it cannot be published to the community library yet.',
          { duration: 8000 },
        );
      }
      navigate(`/journeys/${journey.journeyId}`);
    },
  });
}
