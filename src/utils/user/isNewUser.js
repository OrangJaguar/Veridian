import { useMemo } from 'react';

/**
 * New user: no journeys yet and has not dismissed the create welcome modal.
 */
export function isNewCreateUser({ journeys, preferences }) {
  if ((journeys?.length ?? 0) > 0) return false;
  return !preferences?.hasSeenCreateWelcome;
}

export function useIsNewCreateUser(journeys, preferences) {
  return useMemo(
    () => isNewCreateUser({ journeys, preferences }),
    [journeys, preferences],
  );
}
