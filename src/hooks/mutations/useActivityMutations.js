import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createActivity, updateActivity, deleteActivity } from '@/api/entities/activities';
import { generateActivityId } from '@/utils/schemas/ids';
import { createActivitySchema } from '@/utils/schemas/activity';

function invalidateActivityQueries(queryClient, { moduleId, journeyId }) {
  if (moduleId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byModule(moduleId) });
  }
  if (journeyId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byJourney(journeyId) });
  }
}

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, input }) => {
      const parsed = createActivitySchema.parse(input);
      return createActivity(journeyId, {
        activityId: generateActivityId(),
        ...parsed,
      });
    },
    onSuccess: (_, { moduleId, journeyId }) => {
      invalidateActivityQueries(queryClient, { moduleId, journeyId });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, patch }) => updateActivity(activityId, patch),
    onSuccess: (_, { moduleId, journeyId, skipInvalidate }) => {
      if (skipInvalidate) return;
      invalidateActivityQueries(queryClient, { moduleId, journeyId });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId }) => deleteActivity(activityId),
    onSuccess: (_, { moduleId, journeyId }) => {
      invalidateActivityQueries(queryClient, { moduleId, journeyId });
    },
  });
}
