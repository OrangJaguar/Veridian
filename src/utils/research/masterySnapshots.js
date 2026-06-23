import { SNAPSHOT_MILESTONE_DAYS, MS_PER_DAY } from '@/utils/research/masterySnapshotConstants';

export function computeDaysLate(firstQuizAt, snapshotDay, now = Date.now()) {
  const milestoneAt = firstQuizAt + snapshotDay * MS_PER_DAY;
  if (now <= milestoneAt) return 0;
  return Math.floor((now - milestoneAt) / MS_PER_DAY);
}

export function countModuleSessions(sessions, moduleId) {
  return sessions.filter(
    (s) => s.moduleId === moduleId && s.status === 'completed',
  ).length;
}

export function sumModuleStudyMinutes(sessions, moduleId) {
  return sessions
    .filter((s) => s.moduleId === moduleId && s.status === 'completed')
    .reduce((sum, s) => sum + (s.durationSec ?? 0), 0) / 60;
}

export function isActiveInPriorWeek(sessions, moduleId, now = Date.now()) {
  const weekAgo = now - 7 * MS_PER_DAY;
  return sessions.some(
    (s) => s.moduleId === moduleId
      && s.status === 'completed'
      && (s.endedAt ?? 0) >= weekAgo,
  );
}

/**
 * Returns snapshot payloads to create (does not write).
 */
export function getPendingMasterySnapshots({
  module,
  sessions,
  existingSnapshots = [],
  now = Date.now(),
}) {
  if (!module?.firstQuizAt) return [];

  const existingDays = new Set(existingSnapshots.map((s) => s.snapshotDay));
  const pending = [];

  for (const snapshotDay of SNAPSHOT_MILESTONE_DAYS) {
    if (existingDays.has(snapshotDay)) continue;
    const milestoneAt = module.firstQuizAt + snapshotDay * MS_PER_DAY;
    if (now < milestoneAt) continue;

    pending.push({
      snapshotDay,
      masteryScore: module.masteryScore ?? 0,
      sessionCount: countModuleSessions(sessions, module.moduleId),
      totalStudyMinutes: Math.round(sumModuleStudyMinutes(sessions, module.moduleId)),
      isActiveAtSnapshot: isActiveInPriorWeek(sessions, module.moduleId, now),
      daysLate: computeDaysLate(module.firstQuizAt, snapshotDay, now),
      capturedAt: now,
    });
  }

  return pending;
}
