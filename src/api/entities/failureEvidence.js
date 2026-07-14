import { updateModule } from '@/api/entities/modules';
import {
  parseModuleFailureEvidence,
  emptyModuleFailureEvidence,
} from '@/utils/failures/evidenceSchema';
import { mergeEvidence, hasProcessedSession } from '@/utils/failures/mergeEvidence';
import { extractEvidenceFromSession } from '@/utils/failures/extractEvidenceFromSession';
import {
  extractEvidenceFromDiagnostic,
  extractEvidenceFromDiagnosticSummary,
} from '@/utils/failures/extractEvidenceFromDiagnostic';
import { parseModuleDiagnosticSummary } from '@/utils/study/diagnosticWeakness';
import { BACKFILL_SESSION_LIMIT } from '@/utils/failures/constants';

export function loadModuleFailureEvidence(module) {
  return parseModuleFailureEvidence(module?.failureEvidence);
}

export async function saveModuleFailureEvidence(moduleId, evidence) {
  return updateModule(moduleId, {
    failureEvidence: JSON.stringify(evidence),
  });
}

export async function ingestSessionEvidence({ module, session, activity, cards = [] }) {
  if (!module?.moduleId || !session?.sessionId) return null;

  const existing = loadModuleFailureEvidence(module);
  if (hasProcessedSession(existing, session.sessionId)) {
    return existing;
  }

  const delta = extractEvidenceFromSession(session, activity, module, cards);
  const merged = mergeEvidence(existing, delta);
  await saveModuleFailureEvidence(module.moduleId, merged);
  return merged;
}

export async function ingestDiagnosticEvidence({ module, placement, sessionId }) {
  if (!module?.moduleId || !placement) return null;

  const existing = loadModuleFailureEvidence(module);
  if (sessionId && hasProcessedSession(existing, sessionId)) {
    return existing;
  }

  const delta = extractEvidenceFromDiagnostic({
    placement,
    moduleId: module.moduleId,
    sessionId,
    activityType: 'baselineCheck',
  });
  const merged = mergeEvidence(existing, delta);
  await saveModuleFailureEvidence(module.moduleId, merged);
  return merged;
}

/**
 * Replay recent sessions + legacy diagnostic summary when evidence is empty.
 */
export async function backfillModuleEvidence(module, sessions = [], cards = []) {
  if (!module?.moduleId) return emptyModuleFailureEvidence();

  let evidence = loadModuleFailureEvidence(module);
  const hasData = Object.keys(evidence.concepts ?? {}).length > 0
    || (evidence.processedSessionIds?.length ?? 0) > 0;

  if (hasData) return evidence;

  const diagnostic = parseModuleDiagnosticSummary(module);
  if (diagnostic) {
    const delta = extractEvidenceFromDiagnosticSummary(diagnostic, {
      moduleId: module.moduleId,
      sessionId: diagnostic.sessionId ?? 'legacy-diagnostic-summary',
    });
    evidence = mergeEvidence(evidence, delta);
  }

  const completed = sessions
    .filter((s) => s.status === 'completed' && s.moduleId === module.moduleId)
    .sort((a, b) => (b.endedAt ?? b.startedAt ?? 0) - (a.endedAt ?? a.startedAt ?? 0))
    .slice(0, BACKFILL_SESSION_LIMIT);

  for (const session of completed) {
    if (hasProcessedSession(evidence, session.sessionId)) continue;
    const delta = extractEvidenceFromSession(session, { type: session.activityType }, module, cards);
    evidence = mergeEvidence(evidence, delta);
  }

  if (evidence.processedSessionIds?.length || Object.keys(evidence.concepts ?? {}).length) {
    await saveModuleFailureEvidence(module.moduleId, evidence);
  }

  return evidence;
}
