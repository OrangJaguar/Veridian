import { toast } from 'sonner';

/**
 * Wraps React Query mutation handlers with optimistic update + rollback.
 */
export function withOptimisticMutation({
  onMutate,
  onError,
  onSettled,
  errorMessage = "Changes couldn't be saved",
}) {
  return {
    onMutate: async (variables) => {
      const context = await onMutate?.(variables);
      return context;
    },
    onError: (err, variables, context) => {
      onError?.(err, variables, context);
      toast.error(errorMessage);
    },
    onSettled: (data, err, variables, context) => {
      onSettled?.(data, err, variables, context);
    },
  };
}

export function patchListItem(list, idKey, id, patch) {
  if (!Array.isArray(list)) return list;
  return list.map((item) => (
    (item[idKey] === id || item.id === id) ? { ...item, ...patch } : item
  ));
}
