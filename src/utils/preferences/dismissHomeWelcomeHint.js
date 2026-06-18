import { queryKeys } from '@/api/query-keys';
import { updatePreferences } from '@/api/entities/preferences';
import { HINT_HOME_WELCOME, appendHintPatch } from '@/utils/preferences/hintsShown';
import { readCachedPreferences } from '@/lib/preferencesCache';

/** Dismiss home welcome banner when user creates their first journey. */
export async function dismissHomeWelcomeHint(queryClient, email) {
  const preferences = readCachedPreferences(queryClient, email);
  const patch = appendHintPatch(preferences, HINT_HOME_WELCOME);
  if (Object.keys(patch).length === 0) return;
  const preferencesKey = email ? queryKeys.preferences(email) : queryKeys.preferences();
  try {
    await updatePreferences(patch);
    queryClient.setQueryData(preferencesKey, (prev) => (
      prev ? { ...prev, ...patch } : prev
    ));
  } catch {
    // non-blocking
  }
}
