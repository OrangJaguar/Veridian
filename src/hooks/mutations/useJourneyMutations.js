import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';
import { generateJourneyId } from '@/utils/schemas/ids';
import { createJourneySchema } from '@/utils/schemas/journey';
import { dismissHomeWelcomeHint } from '@/utils/preferences/dismissHomeWelcomeHint';
import { patchListItem } from '@/lib/optimisticMutation';
import { useAuth } from '@/hooks/useAuth';
import { createJourney, updateJourney, deleteJourney } from '@/api/entities/journeys';
import { toast } from 'sonner';

function invalidateJourneyQueries(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.archived });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
  queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
  if (journeyId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.studyPlan(journeyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.weeklyPlan(journeyId) });
  }
}

function invalidateAllHomeData(queryClient) {
  invalidateJourneyQueries(queryClient);
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input) => {
      const parsed = createJourneySchema.parse(input);
      return createJourney({
        journeyId: generateJourneyId(),
        ...parsed,
      });
    },
    onSuccess: async () => {
      await dismissHomeWelcomeHint(queryClient, user?.email);
      invalidateAllHomeData(queryClient);
    },
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ journeyId, patch }) => {
      const result = await updateJourney(journeyId, patch);
      if ('examDate' in patch) {
        await rebuildGlobalPlan({ force: true });
      }
      return result;
    },
    onMutate: async ({ journeyId, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
      const prevDetail = queryClient.getQueryData(queryKeys.journeys.detail(journeyId));
      const prevAll = queryClient.getQueryData(queryKeys.journeys.all);
      const prevArchived = queryClient.getQueryData(queryKeys.journeys.archived);

      queryClient.setQueryData(queryKeys.journeys.detail(journeyId), (old) => (
        old ? { ...old, ...patch } : old
      ));
      queryClient.setQueryData(queryKeys.journeys.all, (old) => (
        patchListItem(old, 'journeyId', journeyId, patch)
      ));
      queryClient.setQueryData(queryKeys.journeys.archived, (old) => (
        patchListItem(old, 'journeyId', journeyId, patch)
      ));

      return { prevDetail, prevAll, prevArchived, journeyId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevDetail !== undefined) {
        queryClient.setQueryData(queryKeys.journeys.detail(ctx.journeyId), ctx.prevDetail);
      }
      if (ctx.prevAll !== undefined) queryClient.setQueryData(queryKeys.journeys.all, ctx.prevAll);
      if (ctx.prevArchived !== undefined) {
        queryClient.setQueryData(queryKeys.journeys.archived, ctx.prevArchived);
      }
      toast.error("Changes couldn't be saved");
    },
    onSettled: (_, __, { journeyId }) => invalidateJourneyQueries(queryClient, journeyId),
  });
}

export function useArchiveJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ journeyId, archived, archivedManually }) => {
      const patch = { archived };
      if (archived && archivedManually) {
        patch.archivedManually = true;
      }
      if (!archived) {
        patch.archivedManually = false;
      }
      const result = await updateJourney(journeyId, patch);
      await rebuildGlobalPlan({ force: true });
      return result;
    },
    onSuccess: (_, { journeyId }) => invalidateJourneyQueries(queryClient, journeyId),
  });
}

export function useDeleteJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId) => deleteJourney(journeyId),
    onSuccess: () => invalidateAllHomeData(queryClient),
    onSettled: async () => {
      try {
        await rebuildGlobalPlan({ force: true });
      } catch {
        /* plan rebuilds on next ensure */
      }
    },
  });
}
