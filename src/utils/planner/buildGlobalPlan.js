import { addDays } from 'date-fns';
import {
  getMondayStart,
  getWeekDayKeys,
  getWeekKey,
  daysUntilExam,
} from '@/utils/weeklyPlan/weekKey';
import { buildPacingMaps } from '@/utils/planner/pacingMode';
import { buildAllModuleContexts } from '@/utils/weeklyPlan/moduleContext';
import { buildModuleSummaries } from '@/utils/weeklyPlan/modulePriorityText';
import { getDueCards } from '@/utils/fsrs';
import { applyFallbackWeekPack } from '@/utils/weeklyPlan/fallbackWeekPack';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import {
  budgetMinFromTier,
  GLOBAL_FSRS_CARD_CAP,
  MIN_JOURNEY_TOUCHES_PER_WEEK,
  MIN_KEEP_SHARP_TOUCHES_PER_WEEK,
  PER_JOURNEY_CAP_MULTI,
  PER_JOURNEY_CAP_SINGLE,
} from '@/utils/planner/constants';
import { allocateJourneyBudgets } from '@/utils/planner/allocation/allocateJourneyBudget';
import { allocateGlobalDay } from '@/utils/planner/allocation/allocateGlobalDay';
import { estimateFsrsMinutes } from '@/utils/planner/estimateMinutes';
import { buildJourneyWeekProjection } from '@/utils/planner/schedule/buildJourneyWeekProjection';
import { enforceMinJourneyTouches } from '@/utils/planner/schedule/enforceMinTouches';
import { stampSnapshotAssignmentIds } from '@/utils/planner/assignmentId';
import { WEEKDAY_KEYS } from '@/utils/schemas/accountability';

function countFsrsForDay(cards, dayDate) {
  const end = new Date(dayDate);
  end.setHours(23, 59, 59, 999);
  return Math.min(GLOBAL_FSRS_CARD_CAP, getDueCards(cards, end.getTime()).length);
}

/**
 * Build user-level global plan + per-journey week projections.
 * Always builds a Mon–Sun week grid. Exam week is per-journey denser packing,
 * not a global collapse to today. Keep sharp is lighter FSRS-first pacing.
 */
export function buildGlobalPlan({
  journeys = [],
  modules = [],
  activities = [],
  sessions = [],
  cards = [],
  studyBudgetTier,
  dailyBudgetMin,
  unavailableWeekdays = [],
  weeklyTargetMinutes = null,
  now = new Date(),
}) {
  const activeJourneys = journeys.filter(
    (j) => !j.archived && j.generationStatus !== 'processing',
  );

  const unavailable = new Set(unavailableWeekdays ?? []);
  const availableDayCount = Math.max(1, 7 - unavailable.size);
  const tierBudget = budgetMinFromTier(studyBudgetTier, dailyBudgetMin);
  const targetDaily = weeklyTargetMinutes != null && weeklyTargetMinutes > 0
    ? Math.round(weeklyTargetMinutes / availableDayCount)
    : null;
  const globalBudgetMin = targetDaily != null
    ? Math.max(10, Math.min(tierBudget, targetDaily))
    : tierBudget;
  const perJourneyCap = {
    multi: PER_JOURNEY_CAP_MULTI,
    single: PER_JOURNEY_CAP_SINGLE,
  };

  const {
    examWeekByJourneyId,
    keepSharpByJourneyId,
    globalMode,
  } = buildPacingMaps(activeJourneys, now);

  const monday = getMondayStart(now);
  const dateKeys = getWeekDayKeys(monday);
  const weekKey = getWeekKey(monday);

  const journeyInputs = activeJourneys.map((journey) => ({
    journey,
    modules: modules.filter((m) => m.journeyId === journey.journeyId),
    activities: activities.filter((a) => a.journeyId === journey.journeyId),
    sessions: sessions.filter((s) => s.journeyId === journey.journeyId),
    cards: cards.filter((c) => c.journeyId === journey.journeyId),
    moduleContexts: buildAllModuleContexts(
      modules.filter((m) => m.journeyId === journey.journeyId),
      activities.filter((a) => a.journeyId === journey.journeyId),
      sessions.filter((s) => s.journeyId === journey.journeyId),
      journey,
    ),
  }));

  const daysUntilExamByJourney = Object.fromEntries(
    activeJourneys.map((j) => [j.journeyId, daysUntilExam(j.examDate, now)]),
  );

  const moduleLastAssignedDay = {};
  const moduleWeekActivity = {};
  const moduleWeekPrescriptionTypes = {};
  const globalDays = [];

  for (let dayIndex = 0; dayIndex < dateKeys.length; dayIndex += 1) {
    const dateKey = dateKeys[dayIndex];
    const dayDate = addDays(monday, dayIndex);
    const weekdayKey = WEEKDAY_KEYS[dayIndex];
    const dayUnavailable = unavailable.has(weekdayKey);

    if (dayUnavailable) {
      globalDays.push({
        dayIndex,
        dateKey,
        estimatedMin: 0,
        assignments: [],
        fsrsCardCount: 0,
        fsrsByJourney: {},
        isRestDay: true,
        unavailable: true,
        dayBudgetMin: globalBudgetMin,
      });
      continue;
    }

    const journeyBudgets = allocateJourneyBudgets({
      journeys: activeJourneys,
      modules,
      sessions,
      globalBudgetMin,
      perJourneyCap,
      keepSharpByJourneyId,
    });

    const { assignments, estimatedMin } = allocateGlobalDay({
      dayIndex,
      journeyInputs,
      journeyBudgets,
      daysUntilExamByJourney,
      moduleLastAssignedDay,
      moduleWeekActivity,
      moduleWeekPrescriptionTypes,
      examWeekByJourneyId,
      keepSharpByJourneyId,
    });

    const allJourneyCards = cards.filter((c) =>
      activeJourneys.some((j) => j.journeyId === c.journeyId),
    );
    const fsrsCardCount = countFsrsForDay(allJourneyCards, dayDate);
    const fsrsMin = estimateFsrsMinutes(fsrsCardCount);

    globalDays.push({
      dayIndex,
      dateKey,
      estimatedMin: estimatedMin + fsrsMin,
      assignments,
      fsrsCardCount,
      fsrsByJourney: distributeFsrsByJourney(
        journeyInputs,
        fsrsCardCount,
        activeJourneys,
      ),
      isRestDay: assignments.length === 0 && fsrsCardCount === 0,
      dayBudgetMin: globalBudgetMin,
    });
  }

  if (activeJourneys.length) {
    for (const input of journeyInputs) {
      const jid = input.journey.journeyId;
      const minTouches = keepSharpByJourneyId[jid]
        ? MIN_KEEP_SHARP_TOUCHES_PER_WEEK
        : MIN_JOURNEY_TOUCHES_PER_WEEK;
      enforceMinJourneyTouches(globalDays, [input], minTouches);
    }
  }

  const mode = globalMode;
  const stampedSnapshot = stampSnapshotAssignmentIds({
    mode,
    weekKey,
    builtAt: now.getTime(),
    dailyBudgetMin: globalBudgetMin,
    studyBudgetTier: studyBudgetTier ?? null,
    days: globalDays,
    journeyIds: activeJourneys.map((j) => j.journeyId),
    journeyModesById: {},
  });

  const journeyProjections = {};
  const journeyModesById = {};
  for (const input of journeyInputs) {
    const journeyId = input.journey.journeyId;
    const examWeek = examWeekByJourneyId[journeyId];
    const keepSharp = keepSharpByJourneyId[journeyId];
    journeyModesById[journeyId] = keepSharp ? 'keepSharp' : examWeek ? 'examWeek' : 'normal';

    let projection = buildJourneyWeekProjection({
      journeyId,
      globalDays: stampedSnapshot.days,
      journey: input.journey,
      moduleContexts: input.moduleContexts,
      cards: input.cards,
      dailyBudgetMin: globalBudgetMin,
      daysUntilExam: daysUntilExamByJourney[journeyId],
      now,
      examWeek,
      keepSharp,
      weekKey,
    });

    if (projection?.days) {
      const activeModules = sortModulesByUrgency(
        input.moduleContexts,
        daysUntilExamByJourney[journeyId],
      );
      const moduleNumberMap = buildModuleNumberMap(input.moduleContexts.map((c) => c.module));
      applyFallbackWeekPack(projection.days, activeModules, moduleNumberMap);
      projection = stampSnapshotAssignmentIds({
        ...projection,
        weekKey,
      });
      projection.moduleSummaries = buildModuleSummaries(activeModules, projection.days);
    }

    journeyProjections[journeyId] = projection;
  }

  stampedSnapshot.journeyModesById = journeyModesById;

  return {
    globalSnapshot: stampedSnapshot,
    journeyProjections,
    weekKey,
    mode,
    builtAt: stampedSnapshot.builtAt,
  };
}

function distributeFsrsByJourney(journeyInputs, totalCap, activeJourneys) {
  if (!totalCap) return {};
  const weights = activeJourneys.map((j) => {
    const cards = journeyInputs.find((i) => i.journey.journeyId === j.journeyId)?.cards ?? [];
    return { journeyId: j.journeyId, count: cards.length };
  });
  const total = weights.reduce((s, w) => s + w.count, 0) || 1;
  const out = {};
  let remaining = totalCap;
  weights.forEach((w, i) => {
    const share = i === weights.length - 1
      ? remaining
      : Math.min(remaining, Math.round((w.count / total) * totalCap));
    out[w.journeyId] = share;
    remaining -= share;
  });
  return out;
}
