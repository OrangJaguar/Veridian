import { stampSnapshotAssignmentIds } from '@/utils/planner/assignmentId';
import { WEEKDAY_KEYS } from '@/utils/schemas/accountability';

function cloneAssignment(assignment, patch = {}) {
  return { ...assignment, ...patch };
}

function findDay(days, dateKey) {
  return days.find((d) => d.dateKey === dateKey) ?? null;
}

function removeAssignment(day, assignmentId) {
  return {
    ...day,
    assignments: (day.assignments ?? []).filter((a) => a.assignmentId !== assignmentId),
  };
}

function addAssignment(day, assignment) {
  return {
    ...day,
    assignments: [...(day.assignments ?? []), assignment],
  };
}

function recomputeDayFlags(day) {
  const assignMin = (day.assignments ?? []).reduce(
    (sum, a) => sum + (a.estimatedMin ?? (a.activityType === 'flashcardSet' ? 10 : 15)),
    0,
  );
  return {
    ...day,
    estimatedMin: assignMin + Math.min(20, Math.ceil((day.fsrsCardCount ?? 0) * 0.45)),
    isRestDay: (day.assignments?.length ?? 0) === 0 && (day.fsrsCardCount ?? 0) === 0,
  };
}

/**
 * Apply active plan overrides to a stamped global snapshot.
 * Pins and moves survive; skips remove; snooze relocates; swap changes activity.
 */
export function applyPlanOverrides(snapshot, overrides = [], {
  unavailableWeekdays = [],
} = {}) {
  if (!snapshot?.days?.length) return snapshot;

  let days = stampSnapshotAssignmentIds(snapshot).days.map((d) => ({
    ...d,
    assignments: [...(d.assignments ?? [])],
  }));

  const unavailable = new Set(unavailableWeekdays ?? []);
  const activeOverrides = (overrides ?? []).filter((o) => o.active !== false
    && (!o.expiresAt || o.expiresAt > Date.now())
    && (!snapshot.weekKey || o.weekKey === snapshot.weekKey));

  // Pins first (mark), then skips, then moves/snoozes, then swaps
  const byAction = {
    pin: [],
    skip: [],
    move: [],
    snooze: [],
    swap: [],
  };
  for (const o of activeOverrides) {
    if (byAction[o.action]) byAction[o.action].push(o);
  }

  const findAssignment = (assignmentId) => {
    for (const day of days) {
      const found = (day.assignments ?? []).find((a) => a.assignmentId === assignmentId);
      if (found) return { day, assignment: found };
    }
    return null;
  };

  for (const o of byAction.pin) {
    const hit = findAssignment(o.assignmentId);
    if (!hit) continue;
    days = days.map((day) => {
      if (day.dateKey !== hit.day.dateKey) return day;
      return {
        ...day,
        assignments: day.assignments.map((a) => (
          a.assignmentId === o.assignmentId
            ? { ...a, pinned: true, overrideAction: 'pin' }
            : a
        )),
      };
    });
  }

  for (const o of byAction.skip) {
    const hit = findAssignment(o.assignmentId);
    if (!hit) continue;
    if (hit.assignment.pinned) continue;
    days = days.map((day) => (
      day.dateKey === hit.day.dateKey
        ? removeAssignment(day, o.assignmentId)
        : day
    ));
  }

  for (const o of [...byAction.move, ...byAction.snooze]) {
    const hit = findAssignment(o.assignmentId);
    if (!hit || !o.targetDateKey) continue;
    if (hit.assignment.pinned && o.action === 'snooze') continue;
    const target = findDay(days, o.targetDateKey);
    if (!target) continue;

    const moved = cloneAssignment(hit.assignment, {
      dateKey: o.targetDateKey,
      overrideAction: o.action,
      pinned: hit.assignment.pinned || o.action === 'move',
    });

    days = days.map((day) => {
      if (day.dateKey === hit.day.dateKey) return removeAssignment(day, o.assignmentId);
      if (day.dateKey === o.targetDateKey) return addAssignment(day, moved);
      return day;
    });
  }

  for (const o of byAction.swap) {
    const hit = findAssignment(o.assignmentId);
    if (!hit) continue;
    days = days.map((day) => {
      if (day.dateKey !== hit.day.dateKey) return day;
      return {
        ...day,
        assignments: day.assignments.map((a) => {
          if (a.assignmentId !== o.assignmentId) return a;
          return {
            ...a,
            activityType: o.swapActivityType ?? a.activityType,
            activityId: o.swapActivityId ?? a.activityId,
            overrideAction: 'swap',
            reasonCode: a.reasonCode || 'fallback_quiz',
          };
        }),
      };
    });
  }

  // Clear non-pinned assignments on unavailable weekdays
  days = days.map((day) => {
    const weekday = WEEKDAY_KEYS[day.dayIndex];
    if (!weekday || !unavailable.has(weekday)) return recomputeDayFlags(day);
    return recomputeDayFlags({
      ...day,
      assignments: (day.assignments ?? []).filter((a) => a.pinned),
      unavailable: true,
    });
  });

  return {
    ...snapshot,
    days,
  };
}

/**
 * Recovery replan: densify remaining week days while preserving pins/moves.
 * Moves unpinned future assignments earlier into free capacity.
 * @param {object} snapshot
 * @param {{ fromDateKey?: string, dailyBudgetMin?: number }} [options]
 */
export function applyRecoveryRepack(snapshot, {
  fromDateKey,
  dailyBudgetMin,
} = {}) {
  if (!snapshot?.days?.length) return snapshot;
  const stamped = stampSnapshotAssignmentIds(snapshot);
  const budget = dailyBudgetMin ?? stamped.dailyBudgetMin ?? 45;
  const days = stamped.days.map((d) => ({
    ...d,
    assignments: [...(d.assignments ?? [])],
  }));

  const startIdx = fromDateKey
    ? Math.max(0, days.findIndex((d) => d.dateKey === fromDateKey))
    : 0;

  const movable = [];
  for (let i = startIdx; i < days.length; i += 1) {
    const day = days[i];
    const keep = [];
    for (const a of day.assignments) {
      if (a.pinned || a.overrideAction === 'move') keep.push(a);
      else movable.push({ ...a, _from: day.dateKey });
    }
    days[i] = { ...day, assignments: keep };
  }

  for (const assignment of movable) {
    let placed = false;
    for (let i = startIdx; i < days.length; i += 1) {
      const day = days[i];
      if (day.unavailable) continue;
      const used = (day.assignments ?? []).reduce(
        (sum, a) => sum + (a.estimatedMin ?? 15),
        0,
      );
      const cost = assignment.estimatedMin ?? 15;
      if (used + cost > budget && (day.assignments?.length ?? 0) > 0) continue;
      days[i] = addAssignment(day, {
        ...assignment,
        dateKey: day.dateKey,
        overrideAction: assignment.overrideAction ?? 'recovery',
      });
      placed = true;
      break;
    }
    if (!placed) {
      // Keep on original day if nowhere else fits
      const orig = days.find((d) => d.dateKey === assignment._from);
      if (orig) {
        const idx = days.findIndex((d) => d.dateKey === orig.dateKey);
        days[idx] = addAssignment(days[idx], assignment);
      }
    }
  }

  return {
    ...stamped,
    days: days.map((d) => recomputeDayFlags({
      ...d,
      assignments: (d.assignments ?? []).map(({ _from: _unused, ...rest }) => rest),
    })),
  };
}

export function weekdayKeyFromDateKey(dateKey) {
  const d = new Date(`${dateKey}T12:00:00`);
  // JS: 0=Sun … 6=Sat → map to mon-first WEEKDAY_KEYS
  const jsDay = d.getDay();
  const monFirst = jsDay === 0 ? 6 : jsDay - 1;
  return WEEKDAY_KEYS[monFirst];
}
