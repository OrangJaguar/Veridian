import { describe, it, expect, beforeEach } from 'vitest';
import {
  maybeFirstEmergingToast,
  hasSeenFirstEmergingToast,
  markFirstEmergingToastSeen,
} from '@/utils/failures/firstEmergingToast';

describe('maybeFirstEmergingToast', () => {
  const memory = new Map();
  const storage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => { memory.set(k, String(v)); },
  };

  beforeEach(() => memory.clear());

  it('tracks seen state in storage', () => {
    expect(hasSeenFirstEmergingToast('m1', storage)).toBe(false);
    markFirstEmergingToastSeen('m1', storage);
    expect(hasSeenFirstEmergingToast('m1', storage)).toBe(true);
  });

  it('returns null when profile has no emerging data', () => {
    expect(maybeFirstEmergingToast({
      moduleId: 'm1',
      profile: { hasData: false },
      formatToast: () => ({ title: 'x' }),
    })).toBeNull();
  });
});
