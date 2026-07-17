/**
 * Deterministic stable assignment identity for planner accountability.
 * Format: {weekKey}|{dateKey}|{journeyId}|{moduleIdOrJourney}|{activityId}|{slot}
 * @param {{
 *   weekKey?: string,
 *   dateKey?: string,
 *   journeyId?: string,
 *   moduleId?: string|null,
 *   activityId?: string,
 *   slot?: number,
 * }} [params]
 */
export function buildAssignmentId({
  weekKey,
  dateKey,
  journeyId,
  moduleId = null,
  activityId,
  slot = 0,
} = {}) {
  const mod = moduleId || 'journey';
  return `${weekKey}|${dateKey}|${journeyId}|${mod}|${activityId}|${slot}`;
}

export function parseAssignmentId(assignmentId) {
  if (!assignmentId || typeof assignmentId !== 'string') return null;
  const parts = assignmentId.split('|');
  if (parts.length < 6) return null;
  const [weekKey, dateKey, journeyId, modulePart, activityId, slotStr] = parts;
  return {
    weekKey,
    dateKey,
    journeyId,
    moduleId: modulePart === 'journey' ? null : modulePart,
    activityId,
    slot: Number(slotStr) || 0,
  };
}

/**
 * Stamp assignmentId onto assignments for a single day.
 * Slot increments when the same activity appears more than once.
 */
export function stampDayAssignmentIds(day, weekKey) {
  if (!day) return day;
  const seen = {};
  const assignments = (day.assignments ?? []).map((a) => {
    const key = `${a.journeyId}|${a.moduleId ?? 'journey'}|${a.activityId}`;
    const slot = seen[key] ?? 0;
    seen[key] = slot + 1;
    return {
      ...a,
      assignmentId: a.assignmentId ?? buildAssignmentId({
        weekKey,
        dateKey: day.dateKey,
        journeyId: a.journeyId,
        moduleId: a.moduleId,
        activityId: a.activityId,
        slot,
      }),
      dateKey: a.dateKey ?? day.dateKey,
      weekKey: a.weekKey ?? weekKey,
    };
  });
  return { ...day, assignments };
}

export function stampSnapshotAssignmentIds(snapshot) {
  if (!snapshot?.days?.length) return snapshot;
  const weekKey = snapshot.weekKey;
  return {
    ...snapshot,
    days: snapshot.days.map((day) => stampDayAssignmentIds(day, weekKey)),
  };
}
