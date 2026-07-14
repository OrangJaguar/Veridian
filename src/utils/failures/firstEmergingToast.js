const STORAGE_PREFIX = 'veridian:firstEmerging:';

export function emergingToastStorageKey(moduleId) {
  return `${STORAGE_PREFIX}${moduleId}`;
}

export function hasSeenFirstEmergingToast(moduleId, storage = sessionStorage) {
  if (!moduleId) return true;
  try {
    return storage.getItem(emergingToastStorageKey(moduleId)) === '1';
  } catch {
    return true;
  }
}

export function markFirstEmergingToastSeen(moduleId, storage = sessionStorage) {
  if (!moduleId) return;
  try {
    storage.setItem(emergingToastStorageKey(moduleId), '1');
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Returns toast payload once when profile first has emerging+ data for a module.
 */
export function maybeFirstEmergingToast({ moduleId, profile, formatToast }) {
  if (!moduleId || !profile?.hasData || !profile.primaryMode) return null;
  if (profile.primaryConfidence !== 'emerging' && profile.primaryConfidence !== 'confirmed') {
    return null;
  }
  if (hasSeenFirstEmergingToast(moduleId)) return null;
  markFirstEmergingToastSeen(moduleId);
  return formatToast?.(profile.primaryMode) ?? null;
}
