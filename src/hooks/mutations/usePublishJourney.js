import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { publishJourney, unpublishJourney, updateJourneyLibraryMeta } from '@/api/entities/library';
import { queryKeys } from '@/api/query-keys';

export function usePublishJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, tags }) => publishJourney(journeyId, { tags }),
    onSuccess: (_, { journeyId }) => {
      invalidateLibrary(queryClient, journeyId);
      toast.success('Published to Community Library');
    },
    onError: (err) => toast.error(err?.message ?? 'Could not publish'),
  });
}

export function useUnpublishJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId) => unpublishJourney(journeyId),
    onSuccess: (_, journeyId) => {
      invalidateLibrary(queryClient, journeyId);
      toast.success('Removed from Community Library');
    },
    onError: (err) => toast.error(err?.message ?? 'Could not unpublish'),
  });
}

export function useUpdateJourneyLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, tags, isPublic }) =>
      updateJourneyLibraryMeta(journeyId, { tags, isPublic }),
    onSuccess: (_, { journeyId }) => {
      invalidateLibrary(queryClient, journeyId);
    },
    onError: (err) => toast.error(err?.message ?? 'Could not update sharing'),
  });
}

function invalidateLibrary(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: ['library'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.library.eligibility(journeyId) });
}
