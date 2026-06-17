import { queryKeys } from '@/api/query-keys';
import { updatePreferences } from '@/api/entities/preferences';
import { HINT_HOME_WELCOME, appendHintPatch } from '@/utils/preferences/hintsShown';

/** Dismiss home welcome banner when user creates their first journey. */
export async function dismissHomeWelcomeHint(queryClient) {
  const preferences = queryClient.getQueryData(queryKeys.preferences);
  const patch = appendHintPatch(preferences, HINT_HOME_WELCOME);
  if (Object.keys(patch).length === 0) return;
  try {
    await updatePreferences(patch);
    queryClient.setQueryData(queryKeys.preferences, (prev) => (
      prev ? { ...prev, ...patch } : prev
    ));
  } catch {
    // non-blocking
  }
}
