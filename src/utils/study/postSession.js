import { calculateModuleMastery } from '@/utils/mastery';
import { getDueCards } from '@/utils/fsrs';
import { updateModule } from '@/api/entities/modules';
import { updateActivity } from '@/api/entities/activities';
import { updateJourney, getJourney } from '@/api/entities/journeys';
import { listActivitiesByJourney } from '@/api/entities/activities';
import { listModulesByJourney } from '@/api/entities/modules';
import { listSessionsByJourney } from '@/api/entities/sessions';
import { listCardsByJourney } from '@/api/entities/cards';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';
import { STAGE_C_PROMOTION_THRESHOLD } from '@/utils/weeklyPlan/constants';
import { isQuizSessionActivityType } from '@/utils/research/quizSessionTypes';
import { getPendingMasterySnapshots } from '@/utils/research/masterySnapshots';
import { listMasterySnapshotsByModule, createMasterySnapshot } from '@/api/entities/masterySnapshots';
import {
  mergeTimedConceptPerformance,
  parseDiagnosticSummary,
  computePressureReadiness,
} from '@/utils/study/conceptPerformance';
import { parseModuleDiagnosticSummary } from '@/utils/study/diagnosticWeakness';
import { ingestSessionEvidence } from '@/api/entities/failureEvidence';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import {
  snapshotModuleProfile,
  shouldRebuildAfterEvidence,
  shouldDebounceEvidenceRebuild,
} from '@/utils/planner/shouldRebuildAfterEvidence';
import { getPreferences, updatePreferences } from '@/api/entities/preferences';
import { queuePrescriptionBankTopUp } from '@/utils/planner/queuePrescriptionBankTopUp';

function patchActivityStats(existing, session) {
  const stats = { ...(existing.stats ?? {}) };
  const total = (stats.totalSessions ?? 0) + 1;
  stats.totalSessions = total;
  stats.lastCompletedAt = session.endedAt ?? Date.now();

  if (session.durationSec != null && session.durationSec > 0) {
    const prevAvg = stats.avgDurationSec ?? session.durationSec;
    stats.avgDurationSec = Math.round(
      ((prevAvg * (total - 1)) + session.durationSec) / total,
    );
  }

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

      const updatedMod = { ...mod, ...stagePatch };
      const beforeProfile = snapshotModuleProfile(updatedMod, now);
      const stageChanged = stagePatch.stage === 'B' || stagePatch.stage === 'C';

      let mergedEvidence = null;
      try {
        mergedEvidence = await ingestSessionEvidence({
          module: updatedMod,
          session: { ...session, status: 'completed', endedAt: session.endedAt ?? now },
          activity,
          cards,
        });
      } catch {
        /* best effort evidence capture */
      }

      const afterProfile = mergedEvidence
        ? computeFailureProfile({ ...updatedMod, failureEvidence: JSON.stringify(mergedEvidence) }, now)
        : snapshotModuleProfile(updatedMod, now);

      const evidenceRebuild = shouldRebuildAfterEvidence({
        beforeProfile,
        afterProfile,
        stageChanged,
      });

      if (evidenceRebuild) {
        const prefs = await getPreferences().catch(() => null);
        const lastAt = prefs?.lastEvidencePlanRebuildAt ?? 0;
        if (!shouldDebounceEvidenceRebuild(lastAt, now)) {
          await rebuildGlobalPlan({ force: true });
          await updatePreferences({ lastEvidencePlanRebuildAt: now }).catch(() => {});
        }
      } else if (stageChanged) {
        await rebuildGlobalPlan({ force: true });
      }

      const prescription = session.sessionData?.prescription;
      if (
        afterProfile.primaryConfidence === 'confirmed'
        && (beforeProfile.primaryMode !== afterProfile.primaryMode
          || beforeProfile.primaryConfidence !== 'confirmed')
        && prescription?.prescriptionType
      ) {
        queuePrescriptionBankTopUp({
          module: updatedMod,
          journeyId,
          activityId: activity.activityId,
          prescriptionType: prescription.prescriptionType,
          primaryMode: afterProfile.primaryMode,
        });
      }

      const isTimedQuiz = session.activityType === 'practiceQuiz' && (
        session.sessionData?.config?.timedMode === true
        || session.sessionData?.quizConfig?.strictMode === true
        || session.sessionData?.quizConfig?.strictTimedMode === true
      );
      if (isTimedQuiz && !mod.timedBaselineCapturedAt) {
        try {
          const questions = session.sessionData?.questions ?? [];
          const answers = session.sessionData?.answers ?? [];
          const moduleDiag = parseModuleDiagnosticSummary(mod);

          if (moduleDiag?.conceptPerformance?.length) {
            const merged = mergeTimedConceptPerformance(
              moduleDiag.conceptPerformance,
              questions,
              answers,
            );
            await updateModule(moduleId, {
              timedBaselineCapturedAt: now,
              moduleDiagnosticSummary: JSON.stringify({
                ...moduleDiag,
                conceptPerformance: merged,
                profile: {
                  ...(moduleDiag.profile ?? {}),
                  pressureReadiness: computePressureReadiness(merged),
                },
              }),
            });
          } else {
            const journeyRecord = await getJourney(journeyId);
            const journeySummary = parseDiagnosticSummary(journeyRecord);
            if (journeySummary?.conceptPerformance?.length) {
              const merged = mergeTimedConceptPerformance(
                journeySummary.conceptPerformance,
                questions,
                answers,
              );
              await updateJourney(journeyId, {
                diagnosticSummary: JSON.stringify({
                  ...journeySummary,
                  conceptPerformance: merged,
                  profile: {
                    ...journeySummary.profile,
                    pressureReadiness: computePressureReadiness(merged),
                  },
                }),
              });
              await updateModule(moduleId, { timedBaselineCapturedAt: now });
            }
          }
        } catch {
          // best effort pressure capture
        }
      }


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
