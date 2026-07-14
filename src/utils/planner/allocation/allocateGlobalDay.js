import { assignActivityType } from '@/utils/weeklyPlan/assignActivityType';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';
import {
  MAX_GLOBAL_ASSIGNMENTS_PER_DAY,
  MAX_HEAVY_ASSIGNMENTS_PER_DAY,
  STAGE_A_GUIDES_PER_DAY,
} from '@/utils/planner/constants';
import { estimateActivityMinutes, isHeavyActivityType } from '@/utils/planner/estimateMinutes';

function stageAIncompleteCount(contexts) {
  return contexts.filter((c) => c.stage === 'A' && !c.guideComplete).length;
}

function pushAssignment({
  assignments,
  pick,
  journey,
  moduleId,
  moduleName,
  moduleNumberMap,
  activities,
  heavyCount,
  journeyMin,
  budget,
  journeyAssignments,
}) {
  const act = activities.find((a) => a.activityId === pick.activity.activityId);
  const cost = estimateActivityMinutes(pick.activityType, act);
  const isHeavy = isHeavyActivityType(pick.activityType);
  if (isHeavy && heavyCount.value >= MAX_HEAVY_ASSIGNMENTS_PER_DAY) return null;
  if (journeyMin.value + cost > budget && journeyAssignments.value > 0) return null;

  assignments.push({
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    moduleId: moduleId ?? null,
    moduleName: moduleName ?? journey.title,
    moduleNumber: moduleId ? moduleNumberMap[moduleId] : null,
    activityId: pick.activity.activityId,
    activityType: pick.activityType,
    reasonCode: pick.reasonCode,
    estimatedMin: cost,
    prescriptionType: pick.prescriptionType ?? null,
    primaryMode: pick.primaryMode ?? null,
    prescriptionSummary: pick.prescriptionSummary ?? null,
    prescription: pick.prescription ?? null,
    quizConfig: pick.quizConfig ?? null,
    flashcardMode: pick.flashcardMode ?? null,
    mixedPhrasing: pick.mixedPhrasing ?? false,
    timed: pick.timed ?? false,
    prescriptionDriven: pick.prescriptionDriven ?? false,
    journeyLevel: pick.journeyLevel ?? false,
  });

  journeyMin.value += cost;
  journeyAssignments.value += 1;
  if (isHeavy) heavyCount.value += 1;
  return cost;
}

/**
 * Pack one global day across journeys under per-journey and global caps.
 * Consecutive-day skip applies only to non–exam-week journeys.
 * Keep-sharp journeys skip if assigned within the last 2 days.
 */
export function allocateGlobalDay({
  dayIndex,
  journeyInputs,
  journeyBudgets,
  daysUntilExamByJourney,
  moduleLastAssignedDay = {},
  moduleWeekActivity = {},
  moduleWeekPrescriptionTypes = {},
  examWeekByJourneyId = {},
  keepSharpByJourneyId = {},
}) {
  const assignments = [];
  const heavyCount = { value: 0 };
  let totalMin = 0;

  const journeyOrder = [...journeyInputs].sort((a, b) => {
    const examA = examWeekByJourneyId[a.journey.journeyId] ? 0 : 1;
    const examB = examWeekByJourneyId[b.journey.journeyId] ? 0 : 1;
    if (examA !== examB) return examA - examB;
    const keepA = keepSharpByJourneyId[a.journey.journeyId] ? 1 : 0;
    const keepB = keepSharpByJourneyId[b.journey.journeyId] ? 1 : 0;
    if (keepA !== keepB) return keepA - keepB;
    const urgA = daysUntilExamByJourney[a.journey.journeyId] ?? 999;
    const urgB = daysUntilExamByJourney[b.journey.journeyId] ?? 999;
    return urgA - urgB;
  });

  for (const input of journeyOrder) {
    const { journey, moduleContexts, activities } = input;
    const budget = journeyBudgets[journey.journeyId] ?? 0;
    const journeyMin = { value: 0 };
    const journeyAssignments = { value: 0 };
    const moduleNumberMap = buildModuleNumberMap(moduleContexts.map((c) => c.module));
    const examWeek = Boolean(examWeekByJourneyId[journey.journeyId]);
    const keepSharp = Boolean(keepSharpByJourneyId[journey.journeyId]);

    const sorted = sortModulesByUrgency(
      moduleContexts,
      daysUntilExamByJourney[journey.journeyId],
    );

    const guidesTodayCap = stageAIncompleteCount(moduleContexts) > 0
      ? STAGE_A_GUIDES_PER_DAY
      : 0;
    let guidesAssignedToday = 0;

    for (const ctx of sorted) {
      if (assignments.length >= MAX_GLOBAL_ASSIGNMENTS_PER_DAY) break;
      if (journeyMin.value >= budget) break;

      const moduleId = ctx.module.moduleId;
      const lastDay = moduleLastAssignedDay[moduleId];
      if (!examWeek && lastDay != null) {
        const gap = dayIndex - lastDay;
        if (keepSharp && gap <= 2) continue;
        if (!keepSharp && gap === 1) continue;
      }

      const weekActs = moduleWeekActivity[moduleId] ?? [];
      const lastType = weekActs[weekActs.length - 1];
      const preferFlashcards = ctx.stage === 'B'
        && lastType === 'practiceQuiz'
        && (ctx.quizAccuracy ?? 0) >= 75;

      const pick = assignActivityType(ctx, dayIndex, {
        preferFlashcards: preferFlashcards || keepSharp,
        daysUntilExam: daysUntilExamByJourney[journey.journeyId],
        moduleWeekPrescriptionTypes,
        preferRetention: keepSharp,
      });
      if (!pick?.activity) continue;

      if (assignments.some((a) => a.moduleId === moduleId && a.journeyId === journey.journeyId)) {
        if (pick.activityType !== 'learningGuide' || guidesAssignedToday >= guidesTodayCap) continue;
      }

      if (pick.activityType === 'learningGuide') {
        if (guidesAssignedToday >= guidesTodayCap) continue;
        guidesAssignedToday += 1;
      }

      // Keep sharp: fewer heavies per journey per day
      if (keepSharp && isHeavyActivityType(pick.activityType) && journeyAssignments.value >= 1) {
        continue;
      }

      const cost = pushAssignment({
        assignments,
        pick,
        journey,
        moduleId,
        moduleName: ctx.module.name,
        moduleNumberMap,
        activities,
        heavyCount,
        journeyMin,
        budget,
        journeyAssignments,
      });
      if (cost == null) continue;

      totalMin += cost;
      moduleLastAssignedDay[moduleId] = dayIndex;
      moduleWeekActivity[moduleId] = [...weekActs, pick.activityType];
      if (pick.prescriptionType) {
        moduleWeekPrescriptionTypes[moduleId] = [
          ...(moduleWeekPrescriptionTypes[moduleId] ?? []),
          pick.prescriptionType,
        ];
      }
    }
  }

  return { assignments, estimatedMin: totalMin };
}
