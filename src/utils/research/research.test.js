import { describe, it, expect } from 'vitest';
import { isQuizSessionActivityType, requiresConfidenceSlider } from '@/utils/research/quizSessionTypes';
import { assertConfidenceSliderPresent, withConfidenceSlider } from '@/utils/research/sessionConfidence';
import { computeSessionBrierScore, meanBrierScore } from '@/utils/research/brierScore';
import { getPendingMasterySnapshots } from '@/utils/research/masterySnapshots';
import { hashEmailToAnonId } from '@/utils/research/anonymizeUser';
import { computeMaiTotalScore } from '@/lib/survey/maiItems';

describe('quizSessionTypes', () => {
  it('identifies quiz session types', () => {
    expect(isQuizSessionActivityType('practiceQuiz')).toBe(true);
    expect(isQuizSessionActivityType('flashcardSet')).toBe(false);
    expect(requiresConfidenceSlider('baselineCheck')).toBe(true);
  });
});

describe('sessionConfidence', () => {
  it('merges confidence slider into session data', () => {
    const merged = withConfidenceSlider(
      { questions: [] },
      { confidenceSlider: { value: 70, submittedAt: '2026-01-01T00:00:00.000Z' } },
    );
    expect(merged.confidenceSlider.value).toBe(70);
  });

  it('blocks complete without confidence slider', () => {
    expect(() => assertConfidenceSliderPresent({}, 'practiceQuiz')).toThrow();
    expect(() => assertConfidenceSliderPresent({
      confidenceSlider: { value: 50, submittedAt: 'x' },
    }, 'practiceQuiz')).not.toThrow();
  });
});

describe('brierScore', () => {
  it('computes per-session brier', () => {
    expect(computeSessionBrierScore(80, 75)).toBeCloseTo((0.8 - 1) ** 2);
    expect(computeSessionBrierScore(30, 50)).toBeCloseTo((0.3 - 0) ** 2);
  });

  it('averages across sessions', () => {
    const mean = meanBrierScore([
      { score: 80, sessionData: { confidenceSlider: { value: 80 } } },
      { score: 40, sessionData: { confidenceSlider: { value: 60 } } },
    ]);
    expect(mean).toBeTypeOf('number');
  });
});

describe('masterySnapshots', () => {
  it('queues pending milestones', () => {
    const now = Date.now();
    const firstQuizAt = now - 8 * 24 * 60 * 60 * 1000;
    const pending = getPendingMasterySnapshots({
      module: { moduleId: 'm1', firstQuizAt, masteryScore: 55 },
      sessions: [],
      existingSnapshots: [],
      now,
    });
    expect(pending.some((p) => p.snapshotDay === 7)).toBe(true);
  });
});

describe('anonymizeUser', () => {
  const testSalt = 'test-salt-only';

  it('returns stable ids', async () => {
    await expect(hashEmailToAnonId('a@b.com', testSalt)).resolves.toBe(
      await hashEmailToAnonId('a@b.com', testSalt),
    );
    const a = await hashEmailToAnonId('a@b.com', testSalt);
    const b = await hashEmailToAnonId('c@d.com', testSalt);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('maiItems', () => {
  it('sums likert responses', () => {
    expect(computeMaiTotalScore([
      { questionIndex: 0, response: 3 },
      { questionIndex: 1, response: 4 },
    ])).toBe(7);
  });
});
