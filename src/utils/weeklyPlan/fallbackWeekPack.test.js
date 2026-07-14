import { describe, it, expect } from 'vitest';
import { applyFallbackWeekPack } from '@/utils/weeklyPlan/fallbackWeekPack';
import { buildModuleContext } from '@/utils/weeklyPlan/moduleContext';
import { buildModuleNumberMap } from '@/utils/weeklyPlan/moduleContext';

describe('applyFallbackWeekPack', () => {
  it('spreads Stage A guides when all days are empty', () => {
    const modules = [
      { moduleId: 'm1', name: 'Intro', stage: 'A', order: 0 },
    ];
    const activities = [
      { activityId: 'a1', moduleId: 'm1', type: 'learningGuide', status: 'notGenerated' },
    ];
    const contexts = modules.map((m) => buildModuleContext(m, activities, []));
    const days = Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      dateKey: `2026-01-0${dayIndex + 1}`,
      assignments: [],
      isRestDay: true,
    }));

    applyFallbackWeekPack(days, contexts, buildModuleNumberMap(modules));

    const total = days.reduce((n, d) => n + d.assignments.length, 0);
    expect(total).toBeGreaterThan(0);
    expect(days.some((d) => d.assignments.some((a) => a.activityType === 'learningGuide'))).toBe(true);
  });
});
