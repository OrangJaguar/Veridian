import { useCallback } from 'react';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import { appendHintPatch } from '@/utils/preferences/hintsShown';

export function useDismissHint(hintId) {
  const { data: preferences } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const dismiss = useCallback(() => {
    const patch = appendHintPatch(preferences, hintId);
    if (Object.keys(patch).length === 0) return;
    updatePreferences.mutate(patch);
  }, [preferences, hintId, updatePreferences]);

  return { dismiss, isPending: updatePreferences.isPending };
}
