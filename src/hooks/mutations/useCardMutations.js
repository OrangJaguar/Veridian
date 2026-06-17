import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createCard, updateCard, deleteCard } from '@/api/entities/cards';
import { generateCardId } from '@/utils/schemas/ids';
import { createCardSchema } from '@/utils/schemas/card';
import { patchListItem } from '@/lib/optimisticMutation';
import { toast } from 'sonner';

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, journeyId, input }) => {
      const parsed = createCardSchema.parse(input);
      return createCard(activityId, journeyId, {
        cardId: generateCardId(),
        ...parsed,
      });
    },
    onSuccess: (_, { activityId, journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, activityId, journeyId, patch }) => updateCard(cardId, patch),
    onMutate: async ({ cardId, activityId, journeyId, patch }) => {
      const activityKey = queryKeys.cards.byActivity(activityId);
      const journeyKey = queryKeys.cards.byJourney(journeyId);
      await queryClient.cancelQueries({ queryKey: activityKey });
      const prevActivity = queryClient.getQueryData(activityKey);
      const prevJourney = queryClient.getQueryData(journeyKey);
      queryClient.setQueryData(activityKey, (old) => patchListItem(old, 'cardId', cardId, patch));
      queryClient.setQueryData(journeyKey, (old) => patchListItem(old, 'cardId', cardId, patch));
      return { prevActivity, prevJourney, activityKey, journeyKey };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevActivity !== undefined) queryClient.setQueryData(ctx.activityKey, ctx.prevActivity);
      if (ctx.prevJourney !== undefined) queryClient.setQueryData(ctx.journeyKey, ctx.prevJourney);
      toast.error("Changes couldn't be saved");
    },
    onSettled: (_, __, { activityId, journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, activityId, journeyId }) => deleteCard(cardId),
    onSuccess: (_, { activityId, journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
    },
  });
}
