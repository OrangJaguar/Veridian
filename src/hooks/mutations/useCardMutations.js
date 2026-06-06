import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { createCard, updateCard, deleteCard } from '@/api/entities/cards';
import { generateCardId } from '@/utils/schemas/ids';
import { createCardSchema } from '@/utils/schemas/card';

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
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, activityId, journeyId, patch }) => updateCard(cardId, patch),
    onSuccess: (_, { activityId, journeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byJourney(journeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.byActivity(activityId) });
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
    },
  });
}
