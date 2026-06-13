function normalize(text) {
  return String(text ?? '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSet(text) {
  return new Set(normalize(text).split(' ').filter((w) => w.length > 2));
}

function jaccard(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (!setA.size || !setB.size) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  const union = setA.size + setB.size - inter;
  return union ? inter / union : 0;
}

function combinedSimilarity(cardA, cardB) {
  const frontSim = jaccard(cardA.front, cardB.front);
  const backSim = jaccard(cardA.back, cardB.back);
  const crossA = jaccard(cardA.front, cardB.back);
  const crossB = jaccard(cardA.back, cardB.front);
  return Math.max((frontSim + backSim) / 2, crossA, crossB);
}

/**
 * Client-side duplicate grouping (fallback / supplement to AI).
 */
export function findDuplicateGroupsClient(cards, threshold = 0.55) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < cards.length; i += 1) {
    if (used.has(i)) continue;
    const group = [i];
    for (let j = i + 1; j < cards.length; j += 1) {
      if (used.has(j)) continue;
      if (combinedSimilarity(cards[i], cards[j]) >= threshold) {
        group.push(j);
        used.add(j);
      }
    }
    if (group.length > 1) {
      groups.push({
        cardIndexes: group,
        reason: 'Similar wording or overlapping content',
      });
      group.forEach((idx) => used.add(idx));
    }
  }

  return groups;
}

/**
 * Apply duplicate resolution — keep one index per group.
 */
export function resolveDuplicateGroups(cards, groups, selections) {
  const drop = new Set();
  for (const group of groups) {
    const keep = selections[group.id ?? group.cardIndexes.join('-')] ?? group.cardIndexes[0];
    for (const idx of group.cardIndexes) {
      if (idx !== keep) drop.add(idx);
    }
  }
  return cards.filter((_, i) => !drop.has(i));
}

export function mergeAiDuplicateGroups(aiGroups) {
  return (aiGroups ?? []).filter((g) => Array.isArray(g.cardIndexes) && g.cardIndexes.length > 1);
}
