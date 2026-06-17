import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { publishJourney, unpublishJourney, updateJourneyLibraryMeta } from '@/api/entities/library';
import { queryKeys } from '@/api/query-keys';
import { patchListItem } from '@/lib/optimisticMutation';

export function usePublishJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, tags }) => publishJourney(journeyId, { tags }),
    onMutate: async ({ journeyId }) => {
      const detailKey = queryKeys.journeys.detail(journeyId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      const prevDetail = queryClient.getQueryData(detailKey);
      const prevAll = queryClient.getQueryData(queryKeys.journeys.all);
      queryClient.setQueryData(detailKey, (old) => (
        old ? { ...old, isPublic: true } : old
      ));
      queryClient.setQueryData(queryKeys.journeys.all, (old) => (
        patchListItem(old, 'journeyId', journeyId, { isPublic: true })
      ));
      return { prevDetail, prevAll, journeyId };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDetail !== undefined) {
        queryClient.setQueryData(queryKeys.journeys.detail(ctx.journeyId), ctx.prevDetail);
      }
      if (ctx?.prevAll !== undefined) queryClient.setQueryData(queryKeys.journeys.all, ctx.prevAll);
      toast.error(err?.message ?? 'Could not publish');
    },
    onSuccess: (_, { journeyId }) => {
      invalidateLibrary(queryClient, journeyId);
      toast.success('Published to Community Library');
    },
  });
}

export function useUnpublishJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId) => unpublishJourney(journeyId),
    onMutate: async (journeyId) => {
      const detailKey = queryKeys.journeys.detail(journeyId);
      const prevDetail = queryClient.getQueryData(detailKey);
      const prevAll = queryClient.getQueryData(queryKeys.journeys.all);
      queryClient.setQueryData(detailKey, (old) => (
        old ? { ...old, isPublic: false } : old
      ));
      queryClient.setQueryData(queryKeys.journeys.all, (old) => (
        patchListItem(old, 'journeyId', journeyId, { isPublic: false })
      ));
      return { prevDetail, prevAll, journeyId };
    },
    onError: (err, journeyId, ctx) => {
      if (ctx?.prevDetail !== undefined) {
        queryClient.setQueryData(queryKeys.journeys.detail(journeyId), ctx.prevDetail);
      }
      if (ctx?.prevAll !== undefined) queryClient.setQueryData(queryKeys.journeys.all, ctx.prevAll);
      toast.error(err?.message ?? 'Could not unpublish');
    },
    onSuccess: (_, journeyId) => {
      invalidateLibrary(queryClient, journeyId);
      toast.success('Removed from Community Library');
    },
  });
}

export function useUpdateJourneyLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, tags, isPublic }) =>
      updateJourneyLibraryMeta(journeyId, { tags, isPublic }),
    onMutate: async ({ journeyId, tags, isPublic }) => {
      const detailKey = queryKeys.journeys.detail(journeyId);
      const patch = {};
      if (tags != null) patch.tags = tags;
      if (isPublic != null) patch.isPublic = isPublic;
      const prevDetail = queryClient.getQueryData(detailKey);
      queryClient.setQueryData(detailKey, (old) => (old ? { ...old, ...patch } : old));
      return { prevDetail, journeyId };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prevDetail !== undefined) {
        queryClient.setQueryData(queryKeys.journeys.detail(ctx.journeyId), ctx.prevDetail);
      }
      toast.error(err?.message ?? 'Could not update sharing');
    },
    onSuccess: (_, { journeyId }) => {
      invalidateLibrary(queryClient, journeyId);
    },
  });
}

function invalidateLibrary(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: ['library'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.library.eligibility(journeyId) });
}
