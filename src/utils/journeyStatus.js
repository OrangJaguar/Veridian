import { averageModuleMastery } from '@/utils/mastery';

/**
 * Derive status note for Journey cards (guide Section 25).
 */
export function getJourneyStatusNote(journey, modules, cards = []) {
  const daysRemaining = journey.examDate
    ? Math.ceil((journey.examDate - Date.now()) / 86400000)
    : null;

  const journeyCards = cards.filter((c) => c.journeyId === journey.journeyId);
  const overdueCards = journeyCards.filter(
    (c) => c.fsrsState?.due <= Date.now() && !c.suspended,
  );

  const daysSinceStudied = journey.lastStudiedAt
    ? Math.floor((Date.now() - journey.lastStudiedAt) / 86400000)
    : null;

  const avgMastery = averageModuleMastery(modules);
  const modulesNeedingAttention = modules.filter((m) => (m.masteryScore ?? 0) < 40).length;

  if (daysRemaining !== null && daysRemaining <= 7) {
    return {
      text: `Exam in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} — review recommended`,
      color: 'red',
    };
  }
  if (overdueCards.length > 0) {
    const count = new Set(overdueCards.map((c) => c.activityId)).size || 1;
    return {
      text: `${count} deck${count !== 1 ? 's' : ''} need card review`,
      color: 'yellow',
    };
  }
  if (daysSinceStudied !== null && daysSinceStudied >= 5) {
    return {
      text: `Last studied ${daysSinceStudied} days ago`,
      color: 'muted',
    };
  }
  if (avgMastery >= 70 && modulesNeedingAttention === 0) {
    return { text: 'On track', color: 'green' };
  }
  return { text: 'Keep studying', color: 'muted' };
}

export const OVERALL_STATUS_LABELS = {
  onTrack: 'On track',
  needsAttention: 'Needs attention',
  behind: 'Behind — focus required',
};
