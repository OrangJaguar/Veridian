/**
 * Compute weekly commitment adherence from durable StudyCommitment rows.
 * Counts promised work (planned/started/completed/missed), not app opens.
 * A session can satisfy at most one commitment (enforced at write time).
 */
export function computeCommitmentAdherence(commitments = [], {
  weekKey = null,
  now = Date.now(),
  todayKey = null,
} = {}) {
  const rows = (commitments ?? []).filter((c) => (
    (!weekKey || c.weekKey === weekKey)
    && c.status !== 'cancelled'
  ));

  let planned = 0;
  let completed = 0;
  let started = 0;
  let skipped = 0;
  let missed = 0;
  let promisedMinutes = 0;
  let completedMinutes = 0;

  for (const c of rows) {
    const mins = c.estimatedMin ?? 15;
    if (c.status === 'skipped') {
      skipped += 1;
      continue;
    }
    planned += 1;
    promisedMinutes += mins;

    if (c.status === 'completed') {
      completed += 1;
      completedMinutes += mins;
    } else if (c.status === 'started') {
      started += 1;
    } else if (c.status === 'missed') {
      missed += 1;
    } else if (c.status === 'planned' && todayKey && c.scheduledDateKey < todayKey) {
      missed += 1;
    }
  }

  const dueOrDone = completed + started + missed;
  const rate = planned > 0 ? completed / planned : null;

  return {
    weekKey,
    total: rows.length,
    planned,
    completed,
    started,
    skipped,
    missed,
    open: planned - completed - missed - started,
    promisedMinutes,
    completedMinutes,
    adherenceRate: rate,
    adherencePercent: rate == null ? null : Math.round(rate * 100),
    computedAt: now,
  };
}

/**
 * Build StudyCommitment payloads from a week's plan assignments.
 */
export function commitmentsFromPlanSnapshot(snapshot, {
  source = 'plan',
  journeyIds = null,
} = {}) {
  if (!snapshot?.days?.length) return [];
  const allow = journeyIds ? new Set(journeyIds) : null;
  const out = [];

  for (const day of snapshot.days) {
    for (const a of day.assignments ?? []) {
      if (allow && !allow.has(a.journeyId)) continue;
      if (!a.activityId || !a.journeyId) continue;
      out.push({
        assignmentId: a.assignmentId ?? null,
        weekKey: snapshot.weekKey,
        journeyId: a.journeyId,
        moduleId: a.moduleId ?? null,
        activityId: a.activityId,
        activityType: a.activityType,
        scheduledDateKey: day.dateKey,
        estimatedMin: a.estimatedMin ?? 15,
        source,
        status: 'planned',
        reason: a.reasonCode ?? null,
      });
    }
  }

  return out;
}
