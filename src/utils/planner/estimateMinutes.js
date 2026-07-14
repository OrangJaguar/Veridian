import { ESTIMATED_MIN } from '@/utils/weeklyPlan/constants';

const HEAVY_DEFAULT_BLEND = 0.6;

/**
 * Blend default duration with user's rolling average from activity stats.
 */
export function estimateActivityMinutes(activityType, activity = null) {
  const base = ESTIMATED_MIN[activityType] ?? 15;
  const avgSec = activity?.stats?.avgDurationSec;
  if (!avgSec || avgSec <= 0) return base;
  const userMin = Math.round(avgSec / 60);
  return Math.round(HEAVY_DEFAULT_BLEND * base + (1 - HEAVY_DEFAULT_BLEND) * userMin);
}

export function estimateFsrsMinutes(cardCount) {
  if (!cardCount) return 0;
  return Math.min(25, Math.ceil(cardCount * 0.5));
}

export function isHeavyActivityType(activityType) {
  return activityType === 'learningGuide' || activityType === 'practiceQuiz'
    || activityType === 'feynman' || activityType === 'freeRecall';
}
