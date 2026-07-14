import { describe, it, expect } from 'vitest';
import { sortModulesByUrgency } from '@/utils/weeklyPlan/moduleUrgency';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';

describe('sortModulesByUrgency', () => {
  it('treats unknown mastery as more urgent than high mastery', () => {
    const unknown = buildModuleContext(
      { moduleId: 'm1', name: 'New Module', stage: 'B', order: 0 },
      [],
      [],
      null,
    );
    const mastered = buildModuleContext(
      { moduleId: 'm2', name: 'Mastered', stage: 'C', masteryScore: 95, order: 1 },
      [],
      [],
      null,
    );
    const sorted = sortModulesByUrgency([mastered, unknown], 30);
    expect(sorted[0].module.moduleId).toBe('m1');
  });

  it('ranks weak mastery above strong mastery', () => {
    const weak = buildModuleContext(
      { moduleId: 'm1', name: 'Weak', stage: 'B', masteryScore: 20, order: 0 },
      [],
      [],
      null,
    );
    const strong = buildModuleContext(
      { moduleId: 'm2', name: 'Strong', stage: 'C', masteryScore: 90, order: 1 },
      [],
      [],
      null,
    );
    const sorted = sortModulesByUrgency([strong, weak], 30);
    expect(sorted[0].module.moduleId).toBe('m1');
  });
});
