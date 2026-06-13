import { updateJourney } from '@/api/entities/journeys';
import { updateModule } from '@/api/entities/modules';
import { buildDiagnosticSummary } from '@/utils/study/diagnosticPlacement';

/**
 * Persist diagnostic placement: module stages, mastery scores, and journey summary.
 */
export async function applyDiagnosticResults(journeyId, placement, sessionId) {
  await Promise.all(
    placement.moduleResults.map((result) =>
      updateModule(result.moduleId, {
        stage: result.assignedStage,
        masteryScore: result.masteryScore,
      }),
    ),
  );

  return updateJourney(journeyId, {
    diagnosticSkipped: false,
    diagnosticSummary: buildDiagnosticSummary(placement, sessionId),
  });
}
