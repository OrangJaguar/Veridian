import { computeFailureProfile } from '@/utils/failures/computeFailureProfile';

const REBUILD_DEBOUNCE_MS = 5 * 60 * 1000;

/**
 * Whether global plan should rebuild after evidence ingestion.
 */
export function shouldRebuildAfterEvidence({
  beforeProfile,
  afterProfile,
  stageChanged = false,
}) {
  if (stageChanged) return true;

  const beforeMode = beforeProfile?.primaryMode ?? null;
  const afterMode = afterProfile?.primaryMode ?? null;
  const beforeConf = beforeProfile?.primaryConfidence ?? null;
  const afterConf = afterProfile?.primaryConfidence ?? null;

  if (beforeMode !== afterMode && afterMode) return true;
  if (beforeConf !== 'confirmed' && afterConf === 'confirmed' && afterMode) return true;
  if (afterProfile?.trend === 'worsening' && afterConf === 'confirmed') return true;

  return false;
}

export function shouldDebounceEvidenceRebuild(lastRebuildAt, now = Date.now()) {
  if (!lastRebuildAt) return false;
  return now - lastRebuildAt < REBUILD_DEBOUNCE_MS;
}

export function snapshotModuleProfile(module, now = Date.now()) {
  return computeFailureProfile(module, now);
}
