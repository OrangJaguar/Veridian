import {
  MAX_PROCESSED_SESSION_IDS,
  MAX_SAMPLES_PER_MODE,
  FAILURE_EVIDENCE_VERSION,
} from '@/utils/failures/constants';
import { emptyModuleFailureEvidence } from '@/utils/failures/evidenceSchema';

function ensureConceptEntry(evidence, conceptId) {
  if (!evidence.concepts[conceptId]) {
    evidence.concepts[conceptId] = { conceptId, modes: {} };
  }
  return evidence.concepts[conceptId];
}

function ensureModeEntry(container, modeId) {
  if (!container[modeId]) {
    container[modeId] = { hits: 0, lastAt: 0, samples: [] };
  }
  return container[modeId];
}

function addHit(modeEntry, weight, sample) {
  modeEntry.hits += weight;
  if (sample?.at) modeEntry.lastAt = Math.max(modeEntry.lastAt ?? 0, sample.at);
  if (sample) {
    const samples = modeEntry.samples ?? [];
    samples.push(sample);
    modeEntry.samples = samples.slice(-MAX_SAMPLES_PER_MODE);
  }
}

/**
 * Merge extracted evidence deltas into existing ModuleFailureEvidence.
 * Skips if sessionId already in processedSessionIds.
 */
export function mergeEvidence(existing, { conceptHits = [], moduleHits = [], sessionId }, now = Date.now()) {
  const base = existing?.version === FAILURE_EVIDENCE_VERSION
    ? structuredClone(existing)
    : emptyModuleFailureEvidence(now);

  if (!base.concepts) base.concepts = {};
  if (!base.moduleLevel) base.moduleLevel = {};
  if (!base.processedSessionIds) base.processedSessionIds = [];

  if (sessionId && base.processedSessionIds.includes(sessionId)) {
    return base;
  }

  for (const hit of conceptHits) {
    if (!hit.conceptId || hit.conceptId === '__module__') continue;
    const concept = ensureConceptEntry(base, hit.conceptId);
    if (!concept.modes) concept.modes = {};
    const modeEntry = ensureModeEntry(concept.modes, hit.modeId);
    addHit(modeEntry, hit.weight ?? 1, hit.sample);
  }

  for (const hit of moduleHits) {
    const modeEntry = ensureModeEntry(base.moduleLevel, hit.modeId);
    addHit(modeEntry, hit.weight ?? 1, hit.sample);
  }

  if (sessionId) {
    base.processedSessionIds = [...base.processedSessionIds, sessionId].slice(-MAX_PROCESSED_SESSION_IDS);
  }

  base.updatedAt = now;
  base.version = FAILURE_EVIDENCE_VERSION;
  return base;
}

export function hasProcessedSession(evidence, sessionId) {
  return Boolean(sessionId && evidence?.processedSessionIds?.includes(sessionId));
}
