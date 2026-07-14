import { describe, it, expect } from 'vitest';
import { buildLandingFailuresContent } from '@/utils/failures/buildLandingFailuresContent';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

const LEGACY_IDS = [
  'conceptual-gap',
  'procedural-breakdown',
  'concept-interference',
  'verbatim-trap',
  'transfer-failure',
  'pressure-collapse',
];

describe('buildLandingFailuresContent', () => {
  it('returns all six canonical failure modes', () => {
    const content = buildLandingFailuresContent();
    expect(content).toHaveLength(6);
    for (const id of FAILURE_MODE_IDS) {
      expect(content.some((item) => item.id === id)).toBe(true);
    }
  });

  it('includes retention_decay', () => {
    const content = buildLandingFailuresContent();
    const retention = content.find((item) => item.id === 'retention_decay');
    expect(retention).toBeTruthy();
    expect(retention.title).toBe('Retention decay');
    expect(retention.detection).toBeTruthy();
  });

  it('does not use legacy hyphenated IDs', () => {
    const content = buildLandingFailuresContent();
    const ids = content.map((item) => item.id);
    for (const legacy of LEGACY_IDS) {
      expect(ids).not.toContain(legacy);
    }
  });

  it('maps title, summary, and detection from taxonomy', () => {
    const content = buildLandingFailuresContent();
    for (const item of content) {
      expect(item.title).toBeTruthy();
      expect(item.summary).toBeTruthy();
      expect(item.detection).toBeTruthy();
    }
  });
});
