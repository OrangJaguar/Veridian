import { averageModuleMastery } from '@/utils/mastery';

function toDateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShortDate(dateKey) {
  const d = new Date(`${dateKey}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Group completed sessions by calendar day for the last N days.
 * Returns [{ date: 'Jul 1', dateKey: '2026-07-01', count: 3 }, ...]
 */
export function aggregateSessionsByDay(sessions, days = 30) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();

  const counts = {};
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.startedAt || s.startedAt < cutoffMs) continue;
    const key = toDateKey(s.startedAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const result = [];
  const d = new Date(cutoff);
  for (let i = 0; i <= days; i++) {
    const key = toDateKey(d.getTime());
    result.push({
      dateKey: key,
      date: formatShortDate(key),
      count: counts[key] ?? 0,
    });
    d.setDate(d.getDate() + 1);
  }

  return result;
}

/**
 * Compute average mastery per journey.
 * Returns [{ journeyTitle, journeyId, mastery }] sorted by mastery desc.
 */
export function aggregateMasteryByJourney(journeys, modules) {
  const modulesByJourney = {};
  for (const m of modules) {
    if (!modulesByJourney[m.journeyId]) modulesByJourney[m.journeyId] = [];
    modulesByJourney[m.journeyId].push(m);
  }

  return journeys
    .map((j) => {
      const jModules = modulesByJourney[j.journeyId] ?? [];
      return {
        journeyTitle: (j.title ?? j.journeyId).slice(0, 25),
        journeyId: j.journeyId,
        mastery: jModules.length ? averageModuleMastery(jModules) : 0,
      };
    })
    .filter((j) => j.mastery > 0)
    .sort((a, b) => b.mastery - a.mastery);
}
