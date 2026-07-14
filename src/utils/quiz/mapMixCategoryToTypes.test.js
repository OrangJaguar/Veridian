import { describe, it, expect } from 'vitest';
import { expandMixCategoryToSlots, getTypeWeightsForCategory } from '@/utils/quiz/mapMixCategoryToTypes';

describe('mapMixCategoryToTypes', () => {
  it('returns weights for understanding', () => {
    const weights = getTypeWeightsForCategory('understanding');
    expect(weights.some((w) => w.type === 'multipleChoice')).toBe(true);
    expect(weights.some((w) => w.type === 'shortAnswer')).toBe(true);
  });

  it('expands discrimination to matching only', () => {
    const slots = expandMixCategoryToSlots('discrimination', 3, { conceptId: 'c1', pairedConceptId: 'c2' });
    expect(slots.every((s) => s.type === 'matching')).toBe(true);
    expect(slots).toHaveLength(3);
  });
});
