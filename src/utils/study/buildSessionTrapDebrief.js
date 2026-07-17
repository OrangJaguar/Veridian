import { extractEvidenceFromSession } from '@/utils/failures/extractEvidenceFromSession';
import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { EMERGING_EVIDENCE_HITS } from '@/utils/failures/constants';
import { getPrescriptionSummary } from '@/utils/failures/prescriptionMatrix';
import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';

/**
 * Build a session trap debrief that separates this-session hits from the
 * cumulative module profile. Suppresses claims when evidence is too thin.
 * @param {{ session: object, activity?: object|null, module: object, cards?: object[], now?: number }} params
 */
export function buildSessionTrapDebrief({
  session,
  activity = null,
  module,
  cards = [],
  now = Date.now(),
} = {}) {
  const empty = {
    sessionHits: [],
    primaryMode: null,
    primaryConfidence: null,
    cumulativePrimaryMode: null,
    cumulativeConfidence: null,
    advice: null,
    suppressed: true,
    suppressionReason: 'Not enough signal from this session yet',
  };

  if (!session || !module) return empty;

  const sessionForExtract = {
    ...session,
    endedAt: session.endedAt ?? now,
  };

  let extraction;
  try {
    extraction = extractEvidenceFromSession(sessionForExtract, activity, module, cards);
  } catch {
    return empty;
  }

  const hitMap = {};
  for (const hit of extraction?.conceptHits ?? []) {
    if (!hit?.modeId) continue;
    if (!hitMap[hit.modeId]) {
      hitMap[hit.modeId] = {
        modeId: hit.modeId,
        hits: 0,
        conceptIds: new Set(),
        notes: new Set(),
      };
    }
    hitMap[hit.modeId].hits += hit.weight ?? 1;
    if (hit.conceptId) hitMap[hit.modeId].conceptIds.add(hit.conceptId);
    if (hit.sample?.note) hitMap[hit.modeId].notes.add(hit.sample.note);
  }
  for (const hit of extraction?.moduleHits ?? []) {
    if (!hit?.modeId) continue;
    if (!hitMap[hit.modeId]) {
      hitMap[hit.modeId] = {
        modeId: hit.modeId,
        hits: 0,
        conceptIds: new Set(),
        notes: new Set(),
      };
    }
    hitMap[hit.modeId].hits += hit.weight ?? 1;
    if (hit.sample?.note) hitMap[hit.modeId].notes.add(hit.sample.note);
  }

  const sessionHits = Object.values(hitMap)
    .map((h) => ({
      modeId: h.modeId,
      hits: h.hits,
      conceptIds: Array.from(h.conceptIds),
      notes: Array.from(h.notes),
    }))
    .sort((a, b) => b.hits - a.hits);

  const sessionPrimary = sessionHits[0] ?? null;
  const sessionStrongEnough = sessionPrimary && sessionPrimary.hits >= EMERGING_EVIDENCE_HITS;

  const cumulative = computeFailureProfile(module);
  const cumulativePrimary = cumulative?.hasData ? cumulative.primaryMode : null;
  const cumulativeConfidence = cumulative?.primaryConfidence ?? null;

  if (!sessionStrongEnough && !cumulativePrimary) {
    return {
      ...empty,
      sessionHits,
      suppressionReason: sessionHits.length
        ? 'Early session signal only. Keep studying before treating this as a pattern.'
        : 'No learning traps detected in this session',
    };
  }

  const primaryMode = sessionStrongEnough ? sessionPrimary.modeId : null;
  const primaryConfidence = sessionStrongEnough ? 'emerging' : null;

  let advice = null;
  const modeForAdvice = primaryMode ?? cumulativePrimary;
  if (modeForAdvice) {
    const meta = getFailureModeMeta(modeForAdvice);
    const prescription = resolveModulePrescription(module);
    const rxSummary = prescription?.shouldApply
      ? (prescription.summary ?? getPrescriptionSummary(prescription.spec))
      : null;
    advice = rxSummary
      ?? meta?.studentExplanation
      ?? meta?.summary
      ?? null;
  }

  return {
    sessionHits,
    primaryMode,
    primaryConfidence,
    cumulativePrimaryMode: cumulativePrimary,
    cumulativeConfidence,
    advice,
    suppressed: !sessionStrongEnough && !cumulativePrimary,
    suppressionReason: sessionStrongEnough || cumulativePrimary
      ? null
      : 'Early session signal only',
  };
}
