function toDateKey(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateKey, n) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toDateKey(d.getTime());
}

/**
 * Compute current and longest study streak from session history.
 * A streak day = at least 1 completed session on that calendar day.
 */
export function computeStreak(sessions) {
  const completed = (sessions ?? []).filter((s) => s.status === 'completed' && s.startedAt);
  if (!completed.length) {
    return { currentStreak: 0, longestStreak: 0, todayCompleted: false, lastStudyDate: null };
  }

  const studyDays = new Set();
  for (const s of completed) {
    studyDays.add(toDateKey(s.startedAt));
  }

  const today = toDateKey(Date.now());
  const todayCompleted = studyDays.has(today);

  const sorted = Array.from(studyDays).sort().reverse();

  let currentStreak = 0;
  let checkDate = todayCompleted ? today : addDays(today, -1);

  if (studyDays.has(checkDate)) {
    currentStreak = 1;
    let prev = addDays(checkDate, -1);
    while (studyDays.has(prev)) {
      currentStreak++;
      prev = addDays(prev, -1);
    }
  }

  let longestStreak = 0;
  let streak = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && addDays(sorted[i], 1) === sorted[i - 1]) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > longestStreak) longestStreak = streak;
  }

  return {
    currentStreak,
    longestStreak,
    todayCompleted,
    lastStudyDate: sorted[0] ?? null,
  };
}
