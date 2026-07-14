import { differenceInDays } from 'date-fns';
import { isExamWeek, daysUntilExam } from '@/utils/weeklyPlan/weekKey';

/**
 * Per-journey pacing:
 * - examWeek: exam within 7 days (future)
 * - keepSharp: no exam OR exam in the past
 * - normal: future exam more than 7 days out
 */
export function resolveJourneyPacingMode(examDate, now = new Date()) {
  if (examDate == null || examDate === '') return 'keepSharp';
  const exam = new Date(examDate);
  if (Number.isNaN(exam.getTime())) return 'keepSharp';

  const delta = differenceInDays(exam, now);
  if (delta < 0) return 'keepSharp';
  if (isExamWeek(examDate, now)) return 'examWeek';
  return 'normal';
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

/**
 * Global plan mode status signal (does not collapse week grid).
 * examWeek wins if any journey is exam week; else keepSharp only if all are keepSharp.
 */
export function resolveGlobalPlanMode(journeys = [], now = new Date()) {
  const active = journeys.filter((j) => !j.archived);
  if (!active.length) return 'normal';

  const modes = active.map((j) => resolveJourneyPacingMode(j.examDate, now));
  if (modes.some((m) => m === 'examWeek')) return 'examWeek';
  if (modes.every((m) => m === 'keepSharp')) return 'keepSharp';
  return 'normal';
}

export function buildPacingMaps(journeys = [], now = new Date()) {
  const examWeekByJourneyId = {};
  const keepSharpByJourneyId = {};
  for (const j of journeys) {
    if (!j?.journeyId) continue;
    const mode = resolveJourneyPacingMode(j.examDate, now);
    examWeekByJourneyId[j.journeyId] = mode === 'examWeek';
    keepSharpByJourneyId[j.journeyId] = mode === 'keepSharp';
  }
  return { examWeekByJourneyId, keepSharpByJourneyId, globalMode: resolveGlobalPlanMode(journeys, now) };
}

export { daysUntilExam, isExamWeek };
