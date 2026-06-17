import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createModule, updateModule, deleteModule } from '@/api/entities/modules';
import { generateModuleId } from '@/utils/schemas/ids';
import { createModuleSchema } from '@/utils/schemas/module';
import { patchListItem } from '@/lib/optimisticMutation';
import { toast } from 'sonner';

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journeyId, input }) => {
      const parsed = createModuleSchema.parse(input);
      return createModule(journeyId, {
        moduleId: generateModuleId(),
        ...parsed,
      });
    },
    onSuccess: (_, { journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, journeyId, patch }) => updateModule(moduleId, patch),
    onMutate: async ({ moduleId, journeyId, patch }) => {
      const listKey = queryKeys.modules.byJourney(journeyId);
      await queryClient.cancelQueries({ queryKey: listKey });
      const prevList = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) => patchListItem(old, 'moduleId', moduleId, patch));
      return { prevList, listKey };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList !== undefined) {
        queryClient.setQueryData(ctx.listKey, ctx.prevList);
      }
      toast.error("Changes couldn't be saved");
    },
    onSettled: (_, __, { moduleId, journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(moduleId) });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, journeyId }) => deleteModule(moduleId),
    onSuccess: (_, { journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.detail(journeyId) });
    },
  });
}
