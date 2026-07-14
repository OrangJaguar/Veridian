import { describe, it, expect } from 'vitest';
import { mapLegacyFailureSignal, normalizeFailureModeId } from '@/utils/failures/legacyFailureMap';

describe('legacyFailureMap', () => {
  it('maps legacy diagnostic signals to canonical IDs', () => {
    expect(mapLegacyFailureSignal('verbatimTrap')).toBe('verbatim_trap');
    expect(mapLegacyFailureSignal('conceptualGap')).toBe('understanding_gap');
    expect(mapLegacyFailureSignal('transferFailure')).toBe('transfer_failure');
    expect(mapLegacyFailureSignal('pressureCollapse')).toBe('pressure_collapse');
    expect(mapLegacyFailureSignal('conceptInterference')).toBe('interference');
  });

  it('passes through canonical IDs unchanged', () => {
    expect(mapLegacyFailureSignal('retention_decay')).toBe('retention_decay');
    expect(normalizeFailureModeId('verbatim_trap')).toBe('verbatim_trap');
  });

  it('returns null for unknown signals', () => {
    expect(mapLegacyFailureSignal('unknownSignal')).toBeNull();
    expect(normalizeFailureModeId('')).toBeNull();
  });
});
