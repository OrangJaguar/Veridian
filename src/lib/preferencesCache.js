import { queryKeys } from '@/api/query-keys';

export function readCachedPreferences(queryClient, email) {
  if (email) {
    return queryClient.getQueryData(queryKeys.preferences(email)) ?? null;
  }

  const match = queryClient.getQueriesData({ queryKey: ['preferences'] });
  return match[0]?.[1] ?? null;
}
