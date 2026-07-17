import { describe, it, expect } from 'vitest';
import { buildLaunchSessionData } from '@/utils/planner/buildLaunchSessionData';

describe('buildLaunchSessionData', () => {
  it('maps prescription fields from due item', () => {
    const data = buildLaunchSessionData({
      prescription: {
        prescriptionType: 'transfer_drill',
        primaryMode: 'transfer_failure',
        summary: 'Practice applying ideas',
      },
      quizConfig: { questionCount: 5, prescriptionDriven: true },
      flashcardMode: 'due',
      mixedPhrasing: true,
    });
    expect(data.prescription.prescriptionType).toBe('transfer_drill');
    expect(data.quizConfig.questionCount).toBe(5);
    expect(data.flashcardMode).toBe('due');
    expect(data.mixedPhrasing).toBe(true);
  });

  it('builds prescription from loose item fields', () => {
    const data = buildLaunchSessionData({
      prescriptionType: 'verbatim_variation',
      primaryMode: 'verbatim_trap',
      prescriptionSummary: 'Wording drill',
    });
    expect(data.prescription.prescriptionType).toBe('verbatim_variation');
    expect(data.prescription.summary).toBe('Wording drill');
  });

  it('returns empty object when no prescription data', () => {
    expect(buildLaunchSessionData({})).toEqual({});
  });

  it('passes through assignment accountability fields', () => {
    const data = buildLaunchSessionData({
      assignmentId: 'id-1',
      commitmentId: 'c-1',
      weekKey: '2026-W29',
      dateKey: '2026-07-13',
    });
    expect(data).toMatchObject({
      assignmentId: 'id-1',
      commitmentId: 'c-1',
      weekKey: '2026-W29',
      dateKey: '2026-07-13',
    });
  });
});
