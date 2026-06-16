import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createJourney, updateJourney, deleteJourney } from '@/api/entities/journeys';
import { rebuildWeeklyPlan } from '@/api/entities/weeklyPlan';
import { generateJourneyId } from '@/utils/schemas/ids';
import { createJourneySchema } from '@/utils/schemas/journey';

function invalidateJourneyQueries(queryClient, journeyId) {
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.archived });
  queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
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

  return useMutation({
    mutationFn: (input) => {
      const parsed = createJourneySchema.parse(input);
      return createJourney({
        journeyId: generateJourneyId(),
        ...parsed,
      });
    },
    onSuccess: () => invalidateAllHomeData(queryClient),
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ journeyId, patch }) => {
      const result = await updateJourney(journeyId, patch);
      if ('examDate' in patch) {
        await rebuildWeeklyPlan(journeyId, { force: true });
      }
      return result;
    },
    onSuccess: (_, { journeyId }) => invalidateJourneyQueries(queryClient, journeyId),
  });
}

export function useArchiveJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, archived }) => updateJourney(journeyId, { archived }),
    onSuccess: (_, { journeyId }) => invalidateJourneyQueries(queryClient, journeyId),
  });
}

export function useDeleteJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId) => deleteJourney(journeyId),
    onSuccess: () => invalidateAllHomeData(queryClient),
  });
}
