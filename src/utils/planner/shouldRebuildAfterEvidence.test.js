import { describe, it, expect } from 'vitest';
import {
  shouldRebuildAfterEvidence,
  shouldDebounceEvidenceRebuild,
} from '@/utils/planner/shouldRebuildAfterEvidence';

describe('shouldRebuildAfterEvidence', () => {
  it('rebuilds on stage change', () => {
    expect(shouldRebuildAfterEvidence({
      beforeProfile: { primaryMode: null },
      afterProfile: { primaryMode: 'verbatim_trap' },
      stageChanged: true,
    })).toBe(true);
  });

  it('rebuilds when primary mode changes', () => {
    expect(shouldRebuildAfterEvidence({
      beforeProfile: { primaryMode: 'verbatim_trap', primaryConfidence: 'confirmed' },
      afterProfile: { primaryMode: 'transfer_failure', primaryConfidence: 'confirmed' },
      stageChanged: false,
    })).toBe(true);
  });

  it('rebuilds when confidence upgrades to confirmed', () => {
    expect(shouldRebuildAfterEvidence({
      beforeProfile: { primaryMode: 'verbatim_trap', primaryConfidence: 'emerging' },
      afterProfile: { primaryMode: 'verbatim_trap', primaryConfidence: 'confirmed' },
      stageChanged: false,
    })).toBe(true);
  });

  it('rebuilds on worsening confirmed trend', () => {
    expect(shouldRebuildAfterEvidence({
      beforeProfile: { primaryMode: 'pressure_collapse', primaryConfidence: 'confirmed', trend: 'stable' },
      afterProfile: { primaryMode: 'pressure_collapse', primaryConfidence: 'confirmed', trend: 'worsening' },
      stageChanged: false,
    })).toBe(true);
  });

  it('does not rebuild when unchanged', () => {
    expect(shouldRebuildAfterEvidence({
      beforeProfile: { primaryMode: 'verbatim_trap', primaryConfidence: 'confirmed', trend: 'stable' },
      afterProfile: { primaryMode: 'verbatim_trap', primaryConfidence: 'confirmed', trend: 'stable' },
      stageChanged: false,
    })).toBe(false);
  });
});

describe('shouldDebounceEvidenceRebuild', () => {
  it('debounces within 5 minutes', () => {
    const now = Date.now();
    expect(shouldDebounceEvidenceRebuild(now - 60_000, now)).toBe(true);
  });

  it('allows rebuild after debounce window', () => {
    const now = Date.now();
    expect(shouldDebounceEvidenceRebuild(now - 6 * 60_000, now)).toBe(false);
  });
});
