import { describe, it, expect } from 'vitest';
import { resolveTonightPrescriptionLaunch } from '@/utils/failures/resolveTonightPrescriptionLaunch';

describe('resolveTonightPrescriptionLaunch', () => {
  const prescription = {
    shouldApply: true,
    primaryMode: 'transfer_failure',
    summary: 'Practice applying ideas in new scenarios',
    spec: {
      prescriptionType: 'transfer_drill',
      activityType: 'practiceQuiz',
      questionMix: { transfer: 4 },
    },
  };

  const activities = [
    { activityId: 'a1', moduleId: 'm1', type: 'practiceQuiz', status: 'ready' },
    { activityId: 'a2', moduleId: 'm1', type: 'learningGuide', status: 'ready' },
  ];

  it('returns null when prescription should not apply', () => {
    expect(resolveTonightPrescriptionLaunch({
      moduleId: 'm1',
      journeyId: 'j1',
      prescription: { shouldApply: false },
      activities,
    })).toBeNull();
  });

  it('prefers a matching Due Today item', () => {
    const dueItems = [{
      id: 'due-1',
      moduleId: 'm1',
      journeyId: 'j1',
      activityId: 'a1',
      activityType: 'practiceQuiz',
      prescriptionDriven: true,
      prescriptionType: 'transfer_drill',
    }];

    const result = resolveTonightPrescriptionLaunch({
      moduleId: 'm1',
      journeyId: 'j1',
      prescription,
      dueItems,
      activities,
    });

    expect(result.source).toBe('dueToday');
    expect(result.item.id).toBe('due-1');
    expect(result.ctaLabel).toBe("Start tonight's practice");
  });

  it('falls back to module activity when no due item', () => {
    const result = resolveTonightPrescriptionLaunch({
      moduleId: 'm1',
      journeyId: 'j1',
      journeyTitle: 'Bio',
      moduleName: 'Cells',
      prescription,
      dueItems: [],
      activities,
    });

    expect(result.source).toBe('fallback');
    expect(result.item.activityId).toBe('a1');
    expect(result.item.prescriptionDriven).toBe(true);
    expect(result.item.moduleName).toBe('Cells');
  });

  it('returns null when activity is missing', () => {
    expect(resolveTonightPrescriptionLaunch({
      moduleId: 'm1',
      journeyId: 'j1',
      prescription,
      dueItems: [],
      activities: [],
    })).toBeNull();
  });

  it('uses Continue label for learning guide', () => {
    const guideRx = {
      shouldApply: true,
      primaryMode: 'understanding_gap',
      summary: 'Core concepts',
      spec: { prescriptionType: 'understanding_guide', activityType: 'learningGuide' },
    };
    const result = resolveTonightPrescriptionLaunch({
      moduleId: 'm1',
      journeyId: 'j1',
      prescription: guideRx,
      activities,
    });
    expect(result.ctaLabel).toBe("Continue tonight's practice");
  });
});
