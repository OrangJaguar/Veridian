import { addDays } from 'date-fns';
import { getMondayStart, getWeekDayKeys, getWeekKey } from '@/utils/weeklyPlan/weekKey';
import { FSRS_DAILY_CARD_CAP } from '@/utils/weeklyPlan/constants';
import { getDueCards } from '@/utils/fsrs';

function countFsrsForDay(cards, dayDate) {
  const end = new Date(dayDate);
  end.setHours(23, 59, 59, 999);
  return Math.min(FSRS_DAILY_CARD_CAP, getDueCards(cards, end.getTime()).length);
}

/**
 * Project one journey's weeklyPlanSnapshot from the global plan.
 * Always a 7-day week; mode is examWeek / keepSharp / normal per journey.
 */
export function buildJourneyWeekProjection({
  journeyId,
  globalDays,
  journey,
  moduleContexts,
  cards = [],
  dailyBudgetMin,
  daysUntilExam,
  now = new Date(),
  examWeek = false,
  keepSharp = false,
  /** @deprecated Use examWeek */
  cram = false,
  weekKey,
}) {
  const isExamWeekJourney = examWeek || cram;
  const monday = getMondayStart(now);
  const dateKeys = getWeekDayKeys(monday);

  const days = dateKeys.map((dateKey, dayIndex) => {
    const globalDay = globalDays.find((d) => d.dateKey === dateKey)
      ?? globalDays[dayIndex];
    const dayDate = addDays(monday, dayIndex);
    const journeyAssignments = (globalDay?.assignments ?? [])
      .filter((a) => a.journeyId === journeyId)
      .map(({ journeyId: _j, journeyTitle: _t, estimatedMin: _e, ...rest }) => rest);

    const fsrsCardCount = countFsrsForDay(cards, dayDate);
    const assignMin = journeyAssignments.reduce((s, a) => {
      const base = a.activityType === 'flashcardSet' ? 10 : 15;
      return s + base;
    }, 0);

    return {
      dayIndex,
      dateKey,
      estimatedMin: assignMin + Math.min(20, Math.ceil(fsrsCardCount * 0.45)),
      assignments: journeyAssignments,
      fsrsCardCount,
      isRestDay: journeyAssignments.length === 0 && fsrsCardCount === 0,
      dayBudgetMin: dailyBudgetMin,
    };
  });

  const mode = isExamWeekJourney ? 'examWeek' : keepSharp ? 'keepSharp' : 'normal';

  return {
    mode,
    weekKey: weekKey ?? getWeekKey(monday),
    builtAt: now.getTime(),
    dailyBudgetMin,
    daysUntilExam,
    days,
    moduleSummaries: [],
    weekStrategy: buildWeekStrategy(journey, moduleContexts, daysUntilExam, mode),
  };
}

function buildWeekStrategy(journey, moduleContexts, daysUntilExam, mode) {
  if (mode === 'keepSharp') {
    return `Keep sharp — light spaced practice and retention for ${journey.title}.`;
  }
  const stageA = moduleContexts.filter((c) => c.stage === 'A' && !c.guideComplete).length;
  const weak = moduleContexts.filter((c) => (c.quizAccuracy ?? 100) < 75).length;
  const parts = [];
  if (stageA > 0) parts.push(`${stageA} guide${stageA === 1 ? '' : 's'} left`);
  if (daysUntilExam != null && daysUntilExam <= 14) {
    parts.push(`exam in ${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'}`);
  }
  if (weak > 0) parts.push(`${weak} module${weak === 1 ? '' : 's'} need quiz practice`);
  if (!parts.length) return `Steady progress on ${journey.title}.`;
  return `${parts.join(' · ')} — focused plan for ${journey.title}.`;
}
