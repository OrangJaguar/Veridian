import { differenceInDays } from 'date-fns';
import { endOfTodayMs } from '@/utils/dueToday/endOfToday';
import { getDueCards } from '@/utils/fsrs';
import { averageModuleMastery } from '@/utils/mastery';

const MAX_ITEMS_PER_JOURNEY = 4;

const ACTIVITY_LABELS = {
  learningGuide: 'Learning Guide',
  practiceQuiz: 'Practice Quiz',
  flashcardSet: 'Flashcard Review',
  feynman: 'Feynman Technique',
  freeRecall: 'Free Recall',
  interleavedReview: 'Interleaved Review',
  journeyChallenge: 'Journey Challenge',
};

const ESTIMATED_MIN = {
  learningGuide: 20,
  practiceQuiz: 15,
  flashcardSet: 10,
  feynman: 15,
  freeRecall: 12,
  interleavedReview: 20,
  journeyChallenge: 25,
};

function daysUntilExam(examDate) {
  if (!examDate) return null;
  return Math.max(0, differenceInDays(new Date(examDate), new Date()));
}

function moduleHref(journeyId, moduleId) {
  return moduleId
    ? `/journeys/${journeyId}/modules/${moduleId}`
    : `/journeys/${journeyId}`;
}

function findActivity(activities, moduleId, type) {
  return activities.find(
    (a) => a.moduleId === moduleId && a.type === type && a.status !== 'failed',
  );
}

function findJourneyActivity(activities, type) {
  return activities.find(
    (a) => a.scope === 'journey' && a.type === type && a.status !== 'failed',
  );
}

function daysSinceStudied(lastStudiedAt) {
  if (!lastStudiedAt) return Infinity;
  return differenceInDays(new Date(), new Date(lastStudiedAt));
}

function moduleLastStudied(moduleId, sessions) {
  const moduleSessions = sessions
    .filter((s) => s.moduleId === moduleId && s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  return moduleSessions[0]?.startedAt ?? null;
}

function learningGuideIncomplete(activity) {
  if (!activity) return true;
  if (activity.status === 'notGenerated') return true;
  const sections = activity.content?.sections;
  if (Array.isArray(sections)) {
    return sections.some((s) => !s.completed);
  }
  return activity.stats?.totalSessions === 0 || activity.stats?.totalSessions == null;
}

function buildItem({
  journey,
  module,
  activity,
  reason,
  urgency,
  cardCount = 0,
}) {
  const activityType = activity.type;
  const estimatedMin = activityType === 'flashcardSet'
    ? Math.max(5, Math.ceil(cardCount * 0.5))
    : (ESTIMATED_MIN[activityType] ?? 15);

  let actionLabel = reason;
  if (activityType === 'flashcardSet') {
    actionLabel = `${cardCount} card${cardCount === 1 ? '' : 's'} due for review`;
  } else if (activityType === 'learningGuide') {
    actionLabel = activity.status === 'notGenerated'
      ? `Start Learning Guide — ${module?.name ?? 'Module'}`
      : `Continue Learning Guide — ${module?.name ?? 'Module'}`;
  } else if (activityType === 'practiceQuiz') {
    actionLabel = reason || 'Practice session recommended';
  }

  return {
    id: `${journey.journeyId}-${activity.activityId}`,
    journeyId: journey.journeyId,
    journeyTitle: journey.title,
    subject: journey.subject,
    moduleId: module?.moduleId ?? null,
    moduleName: module?.name ?? null,
    activityId: activity.activityId,
    activityType,
    activityLabel: ACTIVITY_LABELS[activityType] ?? activity.title ?? activityType,
    reason,
    actionLabel,
    urgency,
    urgencyDays: daysUntilExam(journey.examDate) ?? 999,
    estimatedMin,
    href: moduleHref(journey.journeyId, module?.moduleId ?? activity.moduleId),
    cardCount,
    lastStudiedAt: journey.lastStudiedAt ?? 0,
  };
}

function deriveOverallStatus(daysLeft, avgMastery) {
  if (daysLeft != null && daysLeft <= 7 && avgMastery < 50) return 'behind';
  if (daysLeft != null && daysLeft <= 14 && avgMastery < 40) return 'needsAttention';
  if (avgMastery >= 70) return 'onTrack';
  return 'needsAttention';
}

const URGENCY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * Generate study plan for a single journey.
 */
export function generateStudyPlan(journey, modules, activities, sessions, cards) {
  const daysLeft = daysUntilExam(journey.examDate);
  const journeyActivities = activities.filter((a) => a.journeyId === journey.journeyId);
  const journeyCards = cards.filter((c) => c.journeyId === journey.journeyId);
  const journeySessions = sessions.filter((s) => s.journeyId === journey.journeyId);
  const avgMastery = averageModuleMastery(modules);

  const candidates = [];
  const usedKeys = new Set();

  const addCandidate = (item) => {
    const key = `${item.moduleId ?? 'journey'}-${item.activityType}-${item.activityId}`;
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    candidates.push(item);
  };

  // 1. FSRS due cards
  for (const act of journeyActivities.filter((a) => a.type === 'flashcardSet')) {
    const actCards = journeyCards.filter((c) => c.activityId === act.activityId);
    const due = getDueCards(actCards, endOfTodayMs());
    if (due.length > 0) {
      const mod = modules.find((m) => m.moduleId === act.moduleId);
      addCandidate(buildItem({
        journey,
        module: mod,
        activity: act,
        reason: `${due.length} cards due`,
        urgency: 'high',
        cardCount: due.length,
      }));
    }
  }

  // 2. Stage A learning guides
  for (const mod of modules.filter((m) => m.stage === 'A')) {
    const guide = findActivity(journeyActivities, mod.moduleId, 'learningGuide');
    if (learningGuideIncomplete(guide)) {
      if (!guide) continue;
      addCandidate(buildItem({
        journey,
        module: mod,
        activity: guide,
        reason: 'Stage A — start learning',
        urgency: daysLeft != null && daysLeft <= 14 ? 'high' : 'medium',
      }));
    }
  }

  // 3. Weak + deadline pressure
  for (const mod of modules) {
    const mastery = mod.masteryScore ?? 0;
    if (mastery < 40 && daysLeft != null && daysLeft <= 14) {
      const quiz = findActivity(journeyActivities, mod.moduleId, 'practiceQuiz');
      if (quiz) {
        addCandidate(buildItem({
          journey,
          module: mod,
          activity: quiz,
          reason: 'Weak concepts detected',
          urgency: 'high',
        }));
      }
    }
  }

  // 4. Neglected modules
  for (const mod of modules) {
    if (daysLeft == null) continue;
    const lastStudied = moduleLastStudied(mod.moduleId, journeySessions);
    const daysSince = daysSinceStudied(lastStudied);
    if (daysSince >= 5) {
      let act;
      let reason = `Not studied in ${daysSince} days`;
      if (mod.stage === 'A') {
        act = findActivity(journeyActivities, mod.moduleId, 'learningGuide');
        reason = `Not studied in ${daysSince} days — continue learning`;
      } else if (mod.stage === 'C') {
        act = findActivity(journeyActivities, mod.moduleId, 'feynman')
          ?? findActivity(journeyActivities, mod.moduleId, 'freeRecall');
        reason = `Not studied in ${daysSince} days — mastery check`;
      } else {
        act = findActivity(journeyActivities, mod.moduleId, 'practiceQuiz');
      }
      if (act) {
        addCandidate(buildItem({
          journey,
          module: mod,
          activity: act,
          reason,
          urgency: 'medium',
        }));
      }
    }
  }

  // 5. Lowest mastery Stage B
  const stageBModules = modules
    .filter((m) => m.stage === 'B')
    .sort((a, b) => (a.masteryScore ?? 0) - (b.masteryScore ?? 0));

  for (const mod of stageBModules.slice(0, 2)) {
    const quiz = findActivity(journeyActivities, mod.moduleId, 'practiceQuiz');
    if (quiz && (mod.masteryScore ?? 0) < 70) {
      addCandidate(buildItem({
        journey,
        module: mod,
        activity: quiz,
        reason: 'Lowest mastery — practice recommended',
        urgency: 'medium',
      }));
    }
  }

  // 6. Ready for Stage C
  for (const mod of modules.filter((m) => m.stage === 'B' && (m.masteryScore ?? 0) > 70)) {
    for (const type of ['feynman', 'freeRecall']) {
      const act = findActivity(journeyActivities, mod.moduleId, type);
      if (act) {
        addCandidate(buildItem({
          journey,
          module: mod,
          activity: act,
          reason: 'Ready for mastery activities',
          urgency: 'low',
        }));
        break;
      }
    }
  }

  // 7. Journey-level activities
  const stageBCount = modules.filter((m) => m.stage === 'B').length;
  if (stageBCount >= 2) {
    const interleaved = findJourneyActivity(journeyActivities, 'interleavedReview');
    if (interleaved) {
      addCandidate(buildItem({
        journey,
        module: null,
        activity: interleaved,
        reason: 'Journey-wide review recommended',
        urgency: 'low',
      }));
    }
  }

  candidates.sort((a, b) => {
    const urg = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urg !== 0) return urg;
    return (a.urgencyDays ?? 999) - (b.urgencyDays ?? 999);
  });

  const todayItems = candidates.slice(0, MAX_ITEMS_PER_JOURNEY);

  const weekPriorities = modules
    .map((mod) => ({
      moduleId: mod.moduleId,
      moduleName: mod.name,
      note: (mod.masteryScore ?? 0) < 40
        ? 'Needs focused practice before exam'
        : mod.stage === 'A'
          ? 'Complete Stage A learning'
          : 'Keep building mastery',
    }))
    .filter((_, i, arr) => {
      if (daysLeft == null) return i === 0;
      return true;
    })
    .slice(0, 5);

  return {
    todayItems,
    weekPriorities,
    daysUntilExam: daysLeft,
    overallStatus: deriveOverallStatus(daysLeft, avgMastery),
  };
}

export function sortByGlobalUrgency(items) {
  return [...items].sort((a, b) => {
    const urg = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (urg !== 0) return urg;
    const days = (a.urgencyDays ?? 999) - (b.urgencyDays ?? 999);
    if (days !== 0) return days;
    return (b.lastStudiedAt ?? 0) - (a.lastStudiedAt ?? 0);
  });
}

export { ACTIVITY_LABELS, ESTIMATED_MIN };
