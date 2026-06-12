export function createEmptyMasteryStats(front) {
  return {
    front,
    recallSec: 0,
    typingSec: 0,
    recallAgainCount: 0,
    typingAttempts: 0,
    typingWrongAttempts: 0,
    typingSkippedCount: 0,
    typingCorrectCount: 0,
    initiallySkipped: false,
  };
}

export function buildMasterySummaryRows(cards, statsByCardId) {
  return cards.map((card) => {
    const id = card.cardId ?? card.id;
    const t = statsByCardId[id] ?? createEmptyMasteryStats(card.front);
    const totalAttempts = t.typingAttempts + t.recallAgainCount;
    const struggled = t.typingWrongAttempts > 0 || t.recallAgainCount > 0;
    const quality = t.initiallySkipped
      ? 'Recovered from skip'
      : struggled
        ? 'Mastered with retries'
        : 'Clean mastery';
    const rowClass = t.initiallySkipped
      ? 'review-skip'
      : struggled
        ? 'review-struggle'
        : 'review-correct';

    return {
      front: t.front || card.front,
      recallSec: t.recallSec || 0,
      typingSec: t.typingSec || 0,
      totalSec: (t.recallSec || 0) + (t.typingSec || 0),
      recallAgainCount: t.recallAgainCount || 0,
      typingAttempts: t.typingAttempts || 0,
      typingWrongAttempts: t.typingWrongAttempts || 0,
      typingSkippedCount: t.typingSkippedCount || 0,
      initiallySkipped: !!t.initiallySkipped,
      struggled,
      totalAttempts,
      quality,
      rowClass,
    };
  });
}

export function formatMasteryCopyText({ mastered, totalTime, rows }) {
  const header = `Veridian Mastery Results\nMastered: ${mastered}\nTotal Time: ${totalTime}\n`;
  const body = rows.map((r) => (
    `${r.front} | ${r.quality} | Recall ${r.recallSec.toFixed(1)}s | Typing ${r.typingSec.toFixed(1)}s | Total ${r.totalSec.toFixed(1)}s | Attempts ${r.totalAttempts} | Typing mistakes ${r.typingWrongAttempts} | Skips ${r.typingSkippedCount} | Recall retries ${r.recallAgainCount}`
  )).join('\n');
  return `${header}\n${body}`;
}
