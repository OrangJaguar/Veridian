import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createActivity, updateActivity, deleteActivity } from '@/api/entities/activities';
import { generateActivityId } from '@/utils/schemas/ids';
import { createActivitySchema } from '@/utils/schemas/activity';

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, journeyId, input }) => {
      const parsed = createActivitySchema.parse(input);
      return createActivity(moduleId, journeyId, {
        activityId: generateActivityId(),
        ...parsed,
      });
    },
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.byModule(moduleId) });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, moduleId, patch }) => updateActivity(activityId, patch),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.byModule(moduleId) });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, moduleId }) => deleteActivity(activityId),
    onSuccess: (_, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.byModule(moduleId) });
    },
  });
}
