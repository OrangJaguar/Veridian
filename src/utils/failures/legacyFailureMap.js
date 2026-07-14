import { isValidFailureModeId } from '@/utils/failures/taxonomy';

const LEGACY_TO_MODE = {
  conceptualGap: 'understanding_gap',
  verbatimTrap: 'verbatim_trap',
  transferFailure: 'transfer_failure',
  pressureCollapse: 'pressure_collapse',
  explanation_gap: 'understanding_gap',
  proceduralBreakdown: 'understanding_gap',
  conceptInterference: 'interference',
};

/** Map legacy diagnostic failureSignals to canonical FAILURE_MODE_IDS. */
export function mapLegacyFailureSignal(signal) {
  if (!signal) return null;
  if (isValidFailureModeId(signal)) return signal;
  return LEGACY_TO_MODE[signal] ?? null;
}

export function normalizeFailureModeId(input) {
  if (!input) return null;
  if (isValidFailureModeId(input)) return input;
  return mapLegacyFailureSignal(input);
}
