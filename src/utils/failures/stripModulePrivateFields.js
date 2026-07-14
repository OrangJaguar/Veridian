/**
 * Remove user-specific diagnostic fields before public exposure.
 */
export function stripModulePrivateFields(mod) {
  if (!mod) return null;
  const {
    failureEvidence,
    moduleDiagnosticSummary,
    baselineScore,
    baselineCapturedAt,
    baselineSkipped,
    timedBaselineCapturedAt,
    firstQuizAt,
    userEmail,
    ...safe
  } = mod;
  return safe;
}
