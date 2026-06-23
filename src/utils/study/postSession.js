import { calculateModuleMastery } from '@/utils/mastery';
import { getDueCards } from '@/utils/fsrs';
import { updateModule } from '@/api/entities/modules';
import { updateActivity } from '@/api/entities/activities';
import { updateJourney } from '@/api/entities/journeys';
import { listActivitiesByJourney } from '@/api/entities/activities';
import { listModulesByJourney } from '@/api/entities/modules';
import { listSessionsByJourney } from '@/api/entities/sessions';
import { listCardsByJourney } from '@/api/entities/cards';
import { rebuildWeeklyPlan } from '@/api/entities/weeklyPlan';
import { STAGE_C_PROMOTION_THRESHOLD } from '@/utils/weeklyPlan/constants';
import { isQuizSessionActivityType } from '@/utils/research/quizSessionTypes';
import { getPendingMasterySnapshots } from '@/utils/research/masterySnapshots';
import { listMasterySnapshotsByModule, createMasterySnapshot } from '@/api/entities/masterySnapshots';

function patchActivityStats(existing, session) {
  const stats = { ...(existing.stats ?? {}) };
  const total = (stats.totalSessions ?? 0) + 1;
  stats.totalSessions = total;
  stats.lastCompletedAt = session.endedAt ?? Date.now();

  if (session.score != null) {
    stats.lastScore = session.score;
    const prevAvg = stats.avgAccuracy ?? session.score;
    stats.avgAccuracy = Math.round(((prevAvg * (total - 1)) + session.score) / total);
  } else if (session.outcomeSummary?.accuracy != null) {
    stats.lastScore = session.outcomeSummary.accuracy;
    const prevAvg = stats.avgAccuracy ?? session.outcomeSummary.accuracy;
    stats.avgAccuracy = Math.round(
      ((prevAvg * (total - 1)) + session.outcomeSummary.accuracy) / total,
    );
  }

  return stats;
}

/**
 * Persist denormalized stats after a completed session.
 */
export async function runPostSessionEffects(session, activity) {
  const { journeyId, moduleId } = session;
  const now = Date.now();

  const stats = patchActivityStats(activity, session);
  if (activity.type === 'flashcardSet' && session.sessionData?.reviews) {
    const journeyCards = await listCardsByJourney(journeyId);
    const actCards = journeyCards.filter((c) => c.activityId === activity.activityId);
    stats.dueCount = getDueCards(actCards).length;
  }

  await updateActivity(activity.activityId, {
    stats,
    lastSessionAt: now,
  });

  await updateJourney(journeyId, { lastStudiedAt: now });

  if (moduleId) {
    const [modules, activities, sessions, cards] = await Promise.all([
      listModulesByJourney(journeyId),
      listActivitiesByJourney(journeyId),
      listSessionsByJourney(journeyId),
      listCardsByJourney(journeyId),
    ]);
    const mod = modules.find((m) => m.moduleId === moduleId);
    if (mod) {
      const masteryScore = calculateModuleMastery(mod, activities, sessions, cards);
      let stagePatch = { masteryScore };

      if (isQuizSessionActivityType(session.activityType) && !mod.firstQuizAt) {
        stagePatch.firstQuizAt = session.endedAt ?? now;
      }

      if (activity.type === 'learningGuide' && mod.stage === 'A') {
        const completedIds = session.sessionData?.completedSectionIds
          ?? activity.content?.progress?.completedSectionIds
          ?? [];
        const total = activity.content?.sections?.length ?? activity.itemCount ?? 0;
        if (total > 0 && completedIds.length >= total) {
          stagePatch = { masteryScore, stage: 'B' };
        }
      } else if (mod.stage === 'B' && masteryScore >= STAGE_C_PROMOTION_THRESHOLD) {
        stagePatch = { masteryScore, stage: 'C' };
      }

      await updateModule(moduleId, stagePatch);
      if (stagePatch.stage === 'B' || stagePatch.stage === 'C') {
        await rebuildWeeklyPlan(journeyId, { force: true });
      }

      const updatedMod = { ...mod, ...stagePatch };
      const allSessions = sessions.map((s) => (
        s.sessionId === session.sessionId
          ? { ...s, status: 'completed', endedAt: session.endedAt ?? now }
          : s
      ));
      const existingSnapshots = await listMasterySnapshotsByModule(moduleId);
      const pending = getPendingMasterySnapshots({
        module: updatedMod,
        sessions: allSessions,
        existingSnapshots,
        now,
      });
      await Promise.all(
        pending.map((snap) => createMasterySnapshot({
          moduleId,
          journeyId,
          ...snap,
        })),
      );
    }
  }
}
