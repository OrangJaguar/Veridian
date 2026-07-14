import { format, startOfWeek, addDays, differenceInDays } from 'date-fns';

/**
 * Monday-start week key: YYYY-Www (ISO week number padded)
 */
export function getWeekKey(date = new Date()) {
  const d = new Date(date);
  return format(d, "yyyy-'W'II");
}

export function getDateKey(date = new Date()) {
  return format(new Date(date), 'yyyy-MM-dd');
}

export function getMondayStart(date = new Date()) {
  return startOfWeek(new Date(date), { weekStartsOn: 1 });
}

export function getWeekDayKeys(mondayStart) {
  const start = getMondayStart(mondayStart);
  return Array.from({ length: 7 }, (_, i) => getDateKey(addDays(start, i)));
}

export function isSameWeek(dateA, dateB) {
  return getWeekKey(dateA) === getWeekKey(dateB);
}

export function isTodayKey(dateKey) {
  return dateKey === getDateKey(new Date());
}

export function daysUntilExam(examDate, now = new Date()) {
  if (!examDate) return null;
  const delta = differenceInDays(new Date(examDate), now);
  if (delta < 0) return null;
  return delta;
}

/** Exam within 7 days (future) → denser per-journey packing (Exam week). */
export function isExamWeek(examDate, now = new Date()) {
  const days = daysUntilExam(examDate, now);
  return days != null && days <= 7;
}

/** @deprecated Use isExamWeek */
export function isCramMode(examDate, now = new Date()) {
  return isExamWeek(examDate, now);
}

/** Normalize stored plan mode; legacy `cram` → `examWeek`. */
export function normalizePlanMode(mode) {
  if (mode === 'cram' || mode === 'examWeek') return 'examWeek';
  if (mode === 'keepSharp') return 'keepSharp';
  return 'normal';
}

export function isExamWeekMode(mode) {
  return normalizePlanMode(mode) === 'examWeek';
}

export function isKeepSharpMode(mode) {
  return normalizePlanMode(mode) === 'keepSharp';
}
