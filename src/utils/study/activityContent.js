/**
 * Helpers for activity content / generation eligibility.
 */

export function hasLearningGuideContent(activity) {
  return Boolean(activity?.content?.sections?.length);
}

export function learningGuideNeedsGeneration(activity) {
  if (!activity || activity.type !== 'learningGuide') return false;
  if (hasLearningGuideContent(activity)) return false;
  return activity.status === 'notGenerated' || activity.status === 'failed';
}

export function isLegacyGeneratingActivity(activity) {
  return activity?.status === 'generating';
}
