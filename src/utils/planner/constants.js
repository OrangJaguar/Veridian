export const STUDY_BUDGET_TIERS = {
  light: 90,
  standard: 150,
  intensive: 210,
};

export const DEFAULT_STUDY_BUDGET_TIER = 'standard';

export const PER_JOURNEY_CAP_MULTI = 40;
export const PER_JOURNEY_CAP_SINGLE = 70;

export const MAX_GLOBAL_ASSIGNMENTS_PER_DAY = 6;
export const MAX_HEAVY_ASSIGNMENTS_PER_DAY = 3;
export const GLOBAL_FSRS_CARD_CAP = 50;

export const STAGE_A_GUIDES_PER_DAY = 2;
export const MIN_JOURNEY_TOUCHES_PER_WEEK = 2;
export const MIN_KEEP_SHARP_TOUCHES_PER_WEEK = 1;

export const HEAVY_ACTIVITY_TYPES = new Set(['learningGuide', 'practiceQuiz', 'feynman', 'freeRecall']);

export function budgetMinFromTier(tier, fallbackMin) {
  if (tier && STUDY_BUDGET_TIERS[tier]) return STUDY_BUDGET_TIERS[tier];
  if (typeof fallbackMin === 'number' && fallbackMin > 0) return fallbackMin;
  return STUDY_BUDGET_TIERS[DEFAULT_STUDY_BUDGET_TIER];
}

export function tierFromBudgetMin(min) {
  const n = Number(min);
  if (n <= 100) return 'light';
  if (n >= 180) return 'intensive';
  return 'standard';
}
