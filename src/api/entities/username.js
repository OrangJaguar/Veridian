import {
  checkUsernameAvailable,
  getPreferences,
  updatePreferences,
} from '@/api/entities/preferences';
import { syncCreatorUsernameOnJourneys } from '@/api/entities/library';
import { requireAuth } from '@/api/requireAuth';
import {
  isValidUsernameFormat,
  normalizeUsername,
} from '@/utils/schemas/preferences';

export const USERNAME_CHANGE_COOLDOWN_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export function getUsernameChangeEligibility(preferences) {
  if (!preferences?.usernameChangedAt) {
    return { canChange: true, nextEligibleAt: null };
  }
  const nextEligibleAt = preferences.usernameChangedAt + USERNAME_CHANGE_COOLDOWN_MS;
  return {
    canChange: Date.now() >= nextEligibleAt,
    nextEligibleAt,
  };
}

export async function changeUsername(username) {
  const user = await requireAuth();
  const normalized = normalizeUsername(username);

  if (!isValidUsernameFormat(normalized)) {
    throw new Error('Please choose a valid username.');
  }

  const prefs = await getPreferences();
  if (!prefs) throw new Error('Preferences not found.');

  if (prefs.username === normalized) {
    return prefs;
  }

  const { canChange, nextEligibleAt } = getUsernameChangeEligibility(prefs);
  if (!canChange) {
    const date = nextEligibleAt
      ? new Date(nextEligibleAt).toLocaleDateString()
      : 'later';
    throw new Error(`You can change your username again on ${date}.`);
  }

  const availability = await checkUsernameAvailable(normalized, { excludeEmail: user.email });
  if (!availability.available) {
    throw new Error('That username is already taken. Try another.');
  }

  const now = Date.now();
  const updated = await updatePreferences({
    username: normalized,
    usernameChangedAt: now,
  });

  await syncCreatorUsernameOnJourneys(normalized);

  return updated;
}
