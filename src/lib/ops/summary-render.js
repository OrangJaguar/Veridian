import { escapeHtml } from '../utils-text';

export function buildMasterySummaryRows(fcBaseCards, masteryTimingByCard, ensureMasteryCardStats) {
  return fcBaseCards.map(card => {
    const t = ensureMasteryCardStats(card.id, card.front);
    const totalAttempts = t.typingAttempts + t.recallAgainCount;
    const struggled = t.typingWrongAttempts > 0 || t.recallAgainCount > 0;
    return {
      front: card.front,
      recallSec: t.recallSec || 0,
      typingSec: t.typingSec || 0,
      totalSec: (t.recallSec || 0) + (t.typingSec || 0),
      recallAgainCount: t.recallAgainCount || 0,
      typingAttempts: t.typingAttempts || 0,
      typingWrongAttempts: t.typingWrongAttempts || 0,
      typingSkippedCount: t.typingSkippedCount || 0,
      initiallySkipped: !!t.initiallySkipped,
      struggled,
      totalAttempts
    };
  });
}

export function toMmSs(totalSec) {
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}