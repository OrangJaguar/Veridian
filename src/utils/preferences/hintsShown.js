export const HINT_HOME_WELCOME = 'home_welcome';
export const HINT_JOURNEY_DETAIL_GUIDE = 'journey_detail_guide';

export function hasHintShown(preferences, hintId) {
  return (preferences?.hintsShown ?? []).includes(hintId);
}

export function appendHintPatch(preferences, hintId) {
  const current = preferences?.hintsShown ?? [];
  if (current.includes(hintId)) return {};
  return { hintsShown: [...current, hintId] };
}

export function mergeHintsPatch(preferences, hintIds) {
  const current = new Set(preferences?.hintsShown ?? []);
  let changed = false;
  for (const id of hintIds) {
    if (!current.has(id)) {
      current.add(id);
      changed = true;
    }
  }
  if (!changed) return {};
  return { hintsShown: [...current] };
}
