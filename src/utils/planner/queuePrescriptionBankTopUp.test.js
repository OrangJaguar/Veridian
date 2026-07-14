import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/entities/journeys', () => ({
  getJourney: vi.fn(),
}));
vi.mock('@/api/entities/activities', () => ({
  getActivity: vi.fn(),
  updateActivity: vi.fn(),
}));
vi.mock('@/api/ai/study', () => ({
  generateQuestionBankSlice: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

import { getJourney } from '@/api/entities/journeys';
import { getActivity, updateActivity } from '@/api/entities/activities';
import { generateQuestionBankSlice } from '@/api/ai/study';
import { queuePrescriptionBankTopUp, __test } from '@/utils/planner/queuePrescriptionBankTopUp';
import { toast } from 'sonner';

describe('queuePrescriptionBankTopUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no-ops when not bank-eligible', async () => {
    getJourney.mockResolvedValue({ journeyId: 'j1', isVeridianCertified: false });
    getActivity.mockResolvedValue({
      activityId: 'a1',
      type: 'practiceQuiz',
      content: { questionBank: [{ stem: 'x', correctAnswer: 'y' }] },
    });

    await queuePrescriptionBankTopUp({
      module: { moduleId: 'm1', knowledgeMap: { concepts: [{ id: 'c1' }] } },
      journeyId: 'j1',
      activityId: 'a1',
      prescriptionType: 'transfer_drill',
    });

    expect(generateQuestionBankSlice).not.toHaveBeenCalled();
  });

  it('skips when topped up within 24h', async () => {
    getJourney.mockResolvedValue({
      journeyId: 'j1',
      isVeridianCertified: true,
    });
    getActivity.mockResolvedValue({
      activityId: 'a1',
      type: 'practiceQuiz',
      content: {
        questionBank: [{ stem: 'existing', correctAnswer: 'a' }],
        lastBankTopUpByType: {
          transfer_drill: Date.now() - 1000,
        },
      },
    });

    await queuePrescriptionBankTopUp({
      module: {
        moduleId: 'm1',
        name: 'Mod',
        knowledgeMap: { concepts: [{ id: 'c1', term: 'T', definition: 'D' }] },
      },
      journeyId: 'j1',
      activityId: 'a1',
      prescriptionType: 'transfer_drill',
    });

    expect(generateQuestionBankSlice).not.toHaveBeenCalled();
  });

  it('append path merges, persists, and toasts', async () => {
    getJourney.mockResolvedValue({
      journeyId: 'j1',
      isVeridianCertified: true,
    });
    getActivity.mockResolvedValue({
      activityId: 'a1',
      type: 'practiceQuiz',
      content: {
        questionBank: [{ id: 'old', stem: 'Old question stem here about chemistry.', correctAnswer: 'A' }],
      },
    });
    generateQuestionBankSlice.mockResolvedValue({
      questions: Array.from({ length: 3 }, (_, i) => ({
        id: `n${i}`,
        type: 'multipleChoice',
        stem: `New solid practice question number ${i} about covalent bonding?`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        conceptId: 'c1',
      })),
    });

    expect(__test.trimBank(Array.from({ length: 90 }, (_, i) => ({ id: i })))).toHaveLength(__test.BANK_CAP);
    expect(__test.wasToppedUpRecently({
      lastBankTopUpByType: { x: Date.now() },
    }, 'x')).toBe(true);

    await queuePrescriptionBankTopUp({
      module: {
        moduleId: 'm1',
        name: 'Mod',
        knowledgeMap: { concepts: [{ id: 'c1', term: 'T', definition: 'D' }] },
      },
      journeyId: 'j1',
      activityId: 'a1',
      prescriptionType: 'transfer_drill',
      primaryMode: 'transfer_failure',
    });

    expect(generateQuestionBankSlice).toHaveBeenCalled();
    expect(updateActivity).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Practice bank updated for next time');
  });
});
