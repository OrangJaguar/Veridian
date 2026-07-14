/**
 * Detect failure modes from diagnostic variant stats (ported from diagnosticPlacement).
 */
export function detectFailureModesFromVariants({ verbatimAcc, applicationAcc, transferAcc }) {
  const modes = [];
  if (verbatimAcc != null && applicationAcc != null && transferAcc != null) {
    if (verbatimAcc >= 67 && (applicationAcc < 50 || transferAcc < 50)) {
      modes.push('verbatim_trap');
    }
    if (transferAcc < 50 && verbatimAcc >= 50) {
      modes.push('transfer_failure');
    }
    if (verbatimAcc < 50 && applicationAcc < 50 && transferAcc < 50) {
      modes.push('understanding_gap');
    }
  }
  return modes;
}

/**
 * Extract evidence deltas from a diagnostic placement module result.
 * Returns { conceptHits: [{ conceptId, modeId, weight }], moduleHits: [{ modeId, weight }] }
 */
export function extractEvidenceFromDiagnostic({ placement, moduleId, sessionId, activityType = 'baselineCheck' }) {
  const result = placement?.moduleResults?.find((r) => r.moduleId === moduleId);
  if (!result) return { conceptHits: [], moduleHits: [], sessionId };

  const now = Date.now();
  const { variantStats = {}, failureSignals = [], weakestConceptId } = result;

  const verbatimAcc = variantStats.verbatim;
  const applicationAcc = variantStats.application;
  const transferAcc = variantStats.transfer;

  const modes = detectFailureModesFromVariants({ verbatimAcc, applicationAcc, transferAcc });

  // Also map legacy failureSignals if present
  for (const signal of failureSignals) {
    if (signal === 'verbatimTrap' && !modes.includes('verbatim_trap')) modes.push('verbatim_trap');
    if (signal === 'transferFailure' && !modes.includes('transfer_failure')) modes.push('transfer_failure');
    if (signal === 'conceptualGap' && !modes.includes('understanding_gap')) modes.push('understanding_gap');
    if (signal === 'pressureCollapse' && !modes.includes('pressure_collapse')) modes.push('pressure_collapse');
  }

  const conceptHits = [];
  const targetConcept = weakestConceptId ?? null;

  for (const modeId of modes) {
    if (targetConcept) {
      conceptHits.push({
        conceptId: targetConcept,
        modeId,
        weight: 2,
        sample: { sessionId, activityType, at: now, note: 'diagnostic' },
      });
    }
  }

  const moduleHits = modes.map((modeId) => ({
    modeId,
    weight: targetConcept ? 1 : 2,
    sample: { sessionId, activityType, at: now, note: 'diagnostic' },
  }));

  return { conceptHits, moduleHits, sessionId };
}

/**
 * Extract from legacy moduleDiagnosticSummary JSON when backfilling.
 */
export function extractEvidenceFromDiagnosticSummary(summary, { moduleId, sessionId = 'legacy-diagnostic' }) {
  if (!summary) return { conceptHits: [], moduleHits: [], sessionId };

  const variantStats = summary.variantStats ?? {};
  const modes = detectFailureModesFromVariants({
    verbatimAcc: variantStats.verbatim,
    applicationAcc: variantStats.application,
    transferAcc: variantStats.transfer,
  });

  for (const signal of summary.failureSignals ?? []) {
    if (signal === 'verbatimTrap' && !modes.includes('verbatim_trap')) modes.push('verbatim_trap');
    if (signal === 'transferFailure' && !modes.includes('transfer_failure')) modes.push('transfer_failure');
    if (signal === 'conceptualGap' && !modes.includes('understanding_gap')) modes.push('understanding_gap');
  }

  const now = Date.now();
  const conceptId = summary.weakestConceptId ?? null;
  const conceptHits = modes.map((modeId) => ({
    conceptId: conceptId ?? '__module__',
    modeId,
    weight: 2,
    sample: { sessionId, activityType: 'baselineCheck', at: summary.completedAt ?? now, note: 'legacy-summary' },
  }));

  const moduleHits = modes.map((modeId) => ({
    modeId,
    weight: 1,
    sample: { sessionId, activityType: 'baselineCheck', at: summary.completedAt ?? now, note: 'legacy-summary' },
  }));

  return { conceptHits: conceptId ? conceptHits : [], moduleHits, sessionId };
}
