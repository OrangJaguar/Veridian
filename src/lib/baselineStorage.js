const COMPLETED_KEY = 'hasCompletedBaseline';
const OUTCOME_KEY = 'baselineOutcome';
const SKIPPED_KEY = 'baselineSkipped';
const REVEAL_SEEN_KEY = 'baselineRevealSeen';

export function getBaselineCompleted() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(COMPLETED_KEY) === 'true';
}

/** Landing unlocked if user completed baseline or skipped to preview. */
export function getBaselineUnlocked() {
  if (typeof window === 'undefined') return false;
  return getBaselineCompleted() || window.localStorage.getItem(SKIPPED_KEY) === 'true';
}

/** @returns {'failed' | 'passed' | 'skipped' | null} */
export function getBaselineOutcome() {
  if (typeof window === 'undefined') return null;
  if (window.localStorage.getItem(SKIPPED_KEY) === 'true') return 'skipped';
  const v = window.localStorage.getItem(OUTCOME_KEY);
  if (v === 'failed' || v === 'passed') return v;
  return null;
}

export function getBaselineRevealSeen() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(REVEAL_SEEN_KEY) === 'true';
}

/** @param {'failed' | 'passed'} outcome */
export function completeBaseline(outcome) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(COMPLETED_KEY, 'true');
  window.localStorage.setItem(OUTCOME_KEY, outcome);
  window.localStorage.removeItem(SKIPPED_KEY);
}

export function skipBaseline() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SKIPPED_KEY, 'true');
  window.localStorage.removeItem(COMPLETED_KEY);
  window.localStorage.removeItem(OUTCOME_KEY);
}

export function markBaselineRevealSeen() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REVEAL_SEEN_KEY, 'true');
}

export function clearBaseline() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(COMPLETED_KEY);
  window.localStorage.removeItem(OUTCOME_KEY);
  window.localStorage.removeItem(SKIPPED_KEY);
  window.localStorage.removeItem(REVEAL_SEEN_KEY);
}
