import { ACTIVITY_LABELS } from '@/utils/weeklyPlan/constants';
import { daysUntilExam, getDateKey } from '@/utils/weeklyPlan/weekKey';
import { selectCardsForToday } from '@/utils/fsrs/dueTodaySchedule';
import { GLOBAL_FSRS_CARD_CAP } from '@/utils/planner/constants';
import { formatReasonCopy, formatPrescriptionReasonCopy } from '@/utils/planner/reasonCopy';
import { getProfileFocusModule } from '@/utils/planner/getProfileFocusModule';
import {
  failureModeToActivity,
  getWeakestConcept,
  getWeakestDiagnosticModule,
  isFreshDiagnostic,
} from '@/utils/study/diagnosticWeakness';

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };

function moduleHref(journeyId, moduleId) {
  return moduleId
    ? `/journeys/${journeyId}/modules/${moduleId}`
    : `/journeys/${journeyId}`;
}

function getTodayGlobalDay(globalSnapshot) {
  if (!globalSnapshot?.days?.length) return null;
  const todayKey = getDateKey();
  return globalSnapshot.days.find((d) => d.dateKey === todayKey)
    ?? globalSnapshot.days[0];
}

function prescriptionFieldsFromAssignment(assignment) {
  return {
    prescriptionType: assignment.prescriptionType ?? null,
    primaryMode: assignment.primaryMode ?? null,
    prescriptionSummary: assignment.prescriptionSummary ?? null,
    prescription: assignment.prescription ?? null,
    quizConfig: assignment.quizConfig ?? null,
    flashcardMode: assignment.flashcardMode ?? null,
    mixedPhrasing: assignment.mixedPhrasing ?? false,
    timed: assignment.timed ?? false,
    prescriptionDriven: assignment.prescriptionDriven ?? false,
    journeyLevel: assignment.journeyLevel ?? false,
  };
}

function buildAssignmentItem(journey, assignment, urgencyDays, tier = 'primary') {
  const activityType = assignment.activityType;
  const estimatedMin = assignment.estimatedMin ?? 15;
  const rxFields = prescriptionFieldsFromAssignment(assignment);
  const reasonText = assignment.prescriptionDriven && assignment.prescriptionSummary
    ? formatPrescriptionReasonCopy({
      reasonCode: assignment.reasonCode,
      moduleName: assignment.moduleName,
      prescriptionSummary: assignment.prescriptionSummary,
    })
    : formatReasonCopy(assignment.reasonCode, {
      moduleName: assignment.moduleName,
    });

  const assignmentId = assignment.assignmentId
    ?? `${journey.journeyId}-${assignment.activityId}`;

  return {
    id: assignmentId,
    assignmentId,
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    subject: journey.subject,
    moduleId: assignment.moduleId,
    moduleName: assignment.moduleName,
    activityId: assignment.activityId,
    activityType,
    activityLabel: ACTIVITY_LABELS[activityType] ?? activityType,
    reason: assignment.reasonCode,
    reasonText,
    actionLabel: reasonText,
    urgency: tier === 'focus' ? 'high' : 'medium',
    urgencyDays,
    estimatedMin,
    href: moduleHref(journey.journeyId, assignment.moduleId),
    tier,
    planAssignment: true,
    isCombinedFsrsDeck: false,
    lastStudiedAt: journey.lastStudiedAt ?? 0,
    dateKey: assignment.dateKey,
    weekKey: assignment.weekKey,
    pinned: assignment.pinned ?? false,
    overrideAction: assignment.overrideAction ?? null,
    ...rxFields,
  };
}

function buildProfileFocusItem(journey, modules, activities, sessions, urgencyDays) {
  const focus = getProfileFocusModule({
    journey,
    modules,
    activities,
    sessions,
  });
  if (!focus) return null;

  const { module: mod, pick } = focus;
  const reasonText = formatPrescriptionReasonCopy({
    reasonCode: 'profile_focus',
    moduleName: mod.name,
    prescriptionSummary: pick.prescriptionSummary,
  });

  return {
    id: `${journey.journeyId}-profile-focus`,
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    subject: journey.subject,
    moduleId: mod.moduleId,
    moduleName: mod.name,
    activityId: pick.activity.activityId,
    activityType: pick.activityType,
    activityLabel: ACTIVITY_LABELS[pick.activityType] ?? pick.activityType,
    reason: 'profile_focus',
    reasonText,
    actionLabel: reasonText,
    urgency: 'high',
    urgencyDays,
    estimatedMin: 15,
    href: moduleHref(journey.journeyId, mod.moduleId),
    tier: 'focus',
    planAssignment: false,
    isCombinedFsrsDeck: false,
    isProfileFocus: true,
    lastStudiedAt: journey.lastStudiedAt ?? 0,
    prescriptionType: pick.prescriptionType,
    primaryMode: pick.primaryMode,
    prescriptionSummary: pick.prescriptionSummary,
    prescription: pick.prescription,
    quizConfig: pick.quizConfig,
    flashcardMode: pick.flashcardMode,
    mixedPhrasing: pick.mixedPhrasing,
    timed: pick.timed,
    prescriptionDriven: true,
  };
}

function buildDiagnosticFocusItem(journey, modules, activities, urgencyDays) {
  if (!isFreshDiagnostic(journey, modules)) return null;

  const weakest = getWeakestDiagnosticModule(journey, modules);
  if (!weakest?.moduleId) return null;

  const mod = modules.find((m) => m.moduleId === weakest.moduleId);
  const concept = getWeakestConcept(journey, weakest.moduleId, modules);
  const activityType = failureModeToActivity(
    weakest.failureSignals?.[0],
    weakest.assignedStage ?? mod?.stage ?? 'A',
  );
  const activity = activities.find(
    (a) => a.moduleId === weakest.moduleId && a.type === activityType && a.status !== 'failed',
  );
  if (!activity) return null;

  const estimatedMin = 15;
  const conceptLabel = concept?.label ? ` on ${concept.label}` : '';
  const reasonText = formatReasonCopy('diagnostic_weakest_signal', {
    moduleName: mod?.name ?? weakest.moduleName,
  });

  return {
    id: `${journey.journeyId}-diagnostic-focus`,
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    subject: journey.subject,
    moduleId: weakest.moduleId,
    moduleName: mod?.name ?? weakest.moduleName,
    activityId: activity.activityId,
    activityType,
    activityLabel: ACTIVITY_LABELS[activityType] ?? activityType,
    reason: 'diagnostic_weakest_signal',
    reasonText,
    actionLabel: `${ACTIVITY_LABELS[activityType] ?? activityType}${conceptLabel} — diagnostic priority`,
    urgency: 'high',
    urgencyDays,
    estimatedMin,
    href: moduleHref(journey.journeyId, weakest.moduleId),
    tier: 'focus',
    planAssignment: false,
    isCombinedFsrsDeck: false,
    isDiagnosticFocus: true,
    lastStudiedAt: journey.lastStudiedAt ?? 0,
  };
}

function buildFsrsItem(journey, todayCards, urgencyDays, journeyCount = 1) {
  const cardCount = todayCards.length;
  const estimatedMin = Math.max(5, Math.ceil(cardCount * 0.5));

  const byActivity = {};
  todayCards.forEach((c) => {
    byActivity[c.activityId] = (byActivity[c.activityId] ?? 0) + 1;
  });
  const primaryActivityId = Object.entries(byActivity)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? `fsrs-${journey.journeyId}`;

  const journeyLabel = journeyCount > 1 ? `${journey.title} · ` : '';

  return {
    id: `${journey.journeyId}-fsrs-combined`,
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    subject: journey.subject,
    moduleId: null,
    moduleName: null,
    activityId: primaryActivityId,
    activityType: 'flashcardSet',
    activityLabel: ACTIVITY_LABELS.flashcardSet,
    reason: 'flashcard_review',
    reasonText: `${journeyLabel}${cardCount} card${cardCount === 1 ? '' : 's'} due for review`,
    actionLabel: `${journeyLabel}${cardCount} card${cardCount === 1 ? '' : 's'} due for review`,
    urgency: 'high',
    urgencyDays,
    estimatedMin,
    href: `/journeys/${journey.journeyId}`,
    cardCount,
    cardIds: todayCards.map((c) => c.cardId),
    tier: 'fsrs',
    planAssignment: false,
    isCombinedFsrsDeck: true,
    lastStudiedAt: journey.lastStudiedAt ?? 0,
  };
}

function applyBudgetTiers(items, budgetMin) {
  let accumulated = 0;
  let focusSet = items.some((item) => item.tier === 'focus');

  return items.map((item) => {
    const next = { ...item };
    if (!focusSet && (item.tier === 'primary' || item.tier === 'fsrs')) {
      next.tier = 'focus';
      focusSet = true;
    }
    accumulated += item.estimatedMin;
    if (accumulated > budgetMin && next.tier !== 'focus') {
      next.tier = 'overflow';
    }
    return next;
  });
}

/**
 * Build Due Today from global plan today slice + FSRS budget layer.
 */
export function getDueTodayItems({
  journeys,
  modules,
  activities,
  cards,
  sessions = [],
  globalSnapshot,
  dailyBudgetMin = 150,
}) {
  const activeJourneys = journeys.filter(
    (j) => !j.archived && j.generationStatus !== 'processing',
  );
  const allItems = [];
  const todayDay = getTodayGlobalDay(globalSnapshot);
  const dateKey = todayDay?.dateKey ?? getDateKey();
  const budgetMin = globalSnapshot?.dailyBudgetMin ?? dailyBudgetMin;
  const fsrsByJourney = todayDay?.fsrsByJourney ?? {};
  let remainingFsrsCap = GLOBAL_FSRS_CARD_CAP;
  const activeJourneyCount = activeJourneys.length;

  for (const journey of activeJourneys) {
    const journeyId = journey.journeyId;
    const journeyModules = modules.filter((m) => m.journeyId === journeyId);
    const journeyActivities = activities.filter((a) => a.journeyId === journeyId);
    const journeySessions = sessions.filter((s) => s.journeyId === journeyId);
    const urgencyDays = daysUntilExam(journey.examDate) ?? 999;

    const profileFocus = buildProfileFocusItem(
      journey,
      journeyModules,
      journeyActivities,
      journeySessions,
      urgencyDays,
    );
    if (profileFocus) {
      allItems.push(profileFocus);
    } else {
      const diagnosticFocus = buildDiagnosticFocusItem(
        journey,
        journeyModules,
        journeyActivities,
        urgencyDays,
      );
      if (diagnosticFocus) {
        allItems.push(diagnosticFocus);
      }
    }

    const assignments = (todayDay?.assignments ?? [])
      .filter((a) => a.journeyId === journeyId);

    for (const assignment of assignments) {
      allItems.push(buildAssignmentItem(journey, assignment, urgencyDays, 'primary'));
    }
  }

  for (const journey of activeJourneys) {
    const journeyId = journey.journeyId;
    const urgencyDays = daysUntilExam(journey.examDate) ?? 999;
    const journeyCards = cards.filter((c) => c.journeyId === journeyId);
    const journeyShare = Math.min(
      fsrsByJourney[journeyId] ?? remainingFsrsCap,
      remainingFsrsCap,
    );
    if (journeyShare <= 0) continue;

    const { todayCards } = selectCardsForToday(journeyCards, {
      dateKey,
      dailyCap: journeyShare,
    });
    remainingFsrsCap -= todayCards.length;

    if (todayCards.length > 0) {
      allItems.push(buildFsrsItem(journey, todayCards, urgencyDays, activeJourneyCount));
    }
  }

  const sorted = [...allItems].sort((a, b) => {
    if (a.isProfileFocus && !b.isProfileFocus) return -1;
    if (!a.isProfileFocus && b.isProfileFocus) return 1;
    if (a.isDiagnosticFocus && !b.isDiagnosticFocus) return -1;
    if (!a.isDiagnosticFocus && b.isDiagnosticFocus) return 1;
    const urg = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urg !== 0) return urg;
    return (a.urgencyDays ?? 999) - (b.urgencyDays ?? 999);
  });

  return applyBudgetTiers(sorted, budgetMin);
}

export function sortByGlobalUrgency(items) {
  return [...items].sort((a, b) => {
    const urg = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urg !== 0) return urg;
    return (a.urgencyDays ?? 999) - (b.urgencyDays ?? 999);
  });
}
