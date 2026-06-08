/**
 * @param {import('./types.js').DueTodayItem[]} items
 * @returns {import('./types.js').DueTodayItem[]}
 */
export function sortDueItems(items) {
  return [...items].sort((a, b) => {
    if (a.urgencyDays !== b.urgencyDays) return a.urgencyDays - b.urgencyDays;
    const cardsA = a.cardCount ?? 0;
    const cardsB = b.cardCount ?? 0;
    if (cardsB !== cardsA) return cardsB - cardsA;
    const lastA = a.lastStudiedAt ?? 0;
    const lastB = b.lastStudiedAt ?? 0;
    return lastA - lastB;
  });
}
