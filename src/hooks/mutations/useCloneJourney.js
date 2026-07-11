import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cloneJourney } from '@/api/entities/cloneJourney';
import { queryKeys } from '@/api/query-keys';

export function useCloneJourney() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ sourceJourneyId, title, examDate, moduleIds }) =>
      cloneJourney(sourceJourneyId, { title, examDate, moduleIds }),
    onSuccess: ({ journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.library.list() });
      toast.success('Journey cloned to your account');
      navigate(`/journeys/${journeyId}`);
    },
    onError: (err) => {
      toast.error(err?.message ?? 'Could not clone journey');
    },
  });
}
