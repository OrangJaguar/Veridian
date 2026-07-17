const MAX_JOURNEYS = 5;
const MAX_MODULES = 8;
const MAX_CARDS = 8;

/**
 * Search the index and return tiered, deduplicated, highlighted results.
 * @param {Array} index - from buildSearchIndex
 * @param {string} query
 * @returns {{ journeys: Array, modules: Array, cards: Array }}
 */
export function searchAndRank(index, query) {
  const empty = { journeys: [], modules: [], cards: [] };
  if (!query || !query.trim()) return empty;

  const q = query.trim().toLowerCase();

  const matches = [];
  for (const item of index) {
    const pos = item.text.indexOf(q);
    if (pos === -1) continue;

    const labelLower = item.label.toLowerCase();
    const labelPos = labelLower.indexOf(q);

    matches.push({
      ...item,
      matchPosition: pos,
      labelMatchStart: labelPos >= 0 ? labelPos : -1,
      labelMatchEnd: labelPos >= 0 ? labelPos + q.length : -1,
    });
  }

  matches.sort((a, b) => a.matchPosition - b.matchPosition);

  const seen = new Set();
  const journeys = [];
  const modules = [];
  const cards = [];

  for (const m of matches) {
    if (seen.has(m.label.toLowerCase())) continue;

    if (m.type === 'journey' && journeys.length < MAX_JOURNEYS) {
      seen.add(m.label.toLowerCase());
      journeys.push(m);
    } else if (m.type === 'module' && modules.length < MAX_MODULES) {
      seen.add(m.label.toLowerCase());
      modules.push(m);
    } else if (m.type === 'card' && cards.length < MAX_CARDS) {
      seen.add(m.label.toLowerCase());
      cards.push(m);
    }
  }

  return { journeys, modules, cards };
}
