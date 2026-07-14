import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { getPrescriptionForMode, getPrescriptionSummary } from '@/utils/failures/prescriptionMatrix';

/**
 * Resolve active prescription for a module from failure profile + stage.
 */
export function resolveModulePrescription(module, now = Date.now()) {
  const profile = computeFailureProfile(module, now);
  const stage = module?.stage ?? 'B';
  const primaryMode = profile.primaryMode;
  const shouldApply = Boolean(profile.hasData && profile.primaryConfidence && primaryMode);

  if (!shouldApply) {
    return {
      spec: null,
      profile,
      primaryMode: null,
      confidence: null,
      shouldApply: false,
      summary: null,
      stage,
    };
  }

  const spec = getPrescriptionForMode(primaryMode, stage);
  return {
    spec,
    profile,
    primaryMode,
    confidence: profile.primaryConfidence,
    shouldApply: Boolean(spec),
    summary: spec ? getPrescriptionSummary(spec) : null,
    stage,
  };
}
