import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { daysUntilExam } from '@/utils/weeklyPlan/weekKey';

/**
 * Aggregate module failure profiles into journey-level rollup.
 */
export function computeJourneyFailureRollup(journey, modules = []) {
  const modeModuleCounts = {};
  const moduleSummaries = [];

  for (const mod of modules) {
    const profile = computeFailureProfile(mod);
    if (!profile.hasData || !profile.primaryMode) continue;

    const meta = getFailureModeMeta(profile.primaryMode);
    modeModuleCounts[profile.primaryMode] = (modeModuleCounts[profile.primaryMode] ?? 0) + 1;

    moduleSummaries.push({
      moduleId: mod.moduleId,
      moduleName: mod.name,
      primaryMode: profile.primaryMode,
      primaryModeTitle: meta?.title ?? profile.primaryMode,
      confidence: profile.primaryConfidence ?? 'emerging',
      topConcept: profile.topConcepts[0]?.label ?? null,
    });
  }

  const rankedConcerns = Object.entries(modeModuleCounts)
    .map(([modeId, count]) => ({
      modeId,
      moduleCount: count,
      title: getFailureModeMeta(modeId)?.title ?? modeId,
    }))
    .sort((a, b) => b.moduleCount - a.moduleCount)
    .slice(0, 3);

  const daysToExam = daysUntilExam(journey?.examDate);

  return {
    hasData: moduleSummaries.length > 0,
    moduleSummaries,
    rankedConcerns,
    modulesWithEvidence: moduleSummaries.length,
    daysToExam,
  };
}
