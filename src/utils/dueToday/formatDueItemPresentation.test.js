import { describe, it, expect } from 'vitest';
import { formatDueItemPresentation } from '@/utils/dueToday/formatDueItemPresentation';

describe('formatDueItemPresentation', () => {
  it('shows activity, reason without names, and Journey · Module once for module assignments', () => {
    const { activityLabel, reasonLine, contextLine } = formatDueItemPresentation({
      activityLabel: 'Practice Quiz',
      activityType: 'practiceQuiz',
      reason: 'rx_transfer_drill',
      prescriptionSummary: 'Transfer fix',
      prescriptionDriven: true,
      journeyTitle: 'Biology 101',
      moduleName: 'Cells',
      moduleId: 'm1',
    });

    expect(activityLabel).toBe('Practice Quiz');
    expect(reasonLine).toBe('Transfer fix');
    expect(contextLine).toBe('Biology 101 · Cells');
    expect(reasonLine).not.toContain('Cells');
    expect(reasonLine).not.toContain('Biology');
  });

  it('does not duplicate module when reasonText already included it', () => {
    const { reasonLine, contextLine } = formatDueItemPresentation({
      activityLabel: 'Practice Quiz',
      reasonText: 'Transfer fix · Cells',
      prescriptionSummary: 'Transfer fix',
      journeyTitle: 'Bio',
      moduleName: 'Cells',
      moduleId: 'm1',
    });

    expect(reasonLine).toBe('Transfer fix');
    expect(contextLine).toBe('Bio · Cells');
    expect(`${reasonLine} ${contextLine}`.match(/Cells/g)?.length).toBe(1);
  });

  it('uses journey-only context for FSRS / journey-level items', () => {
    const fsrs = formatDueItemPresentation({
      activityLabel: 'Flashcard review',
      reason: 'flashcard_review',
      journeyTitle: 'Bio',
      moduleName: 'Cells',
      isCombinedFsrsDeck: true,
    });
    expect(fsrs.contextLine).toBe('Bio');
    expect(fsrs.reasonLine).not.toContain('Cells');

    const challenge = formatDueItemPresentation({
      activityLabel: 'Journey Challenge',
      activityType: 'journeyChallenge',
      journeyTitle: 'Bio',
      moduleName: 'Bio',
      journeyLevel: true,
    });
    expect(challenge.contextLine).toBe('Bio');
  });

  it('formats brief reason for non-prescription assignments', () => {
    const { reasonLine, contextLine } = formatDueItemPresentation({
      activityLabel: 'Learning Guide',
      reason: 'guide_not_started',
      journeyTitle: 'History',
      moduleName: 'WWI',
      moduleId: 'm9',
    });
    expect(reasonLine).toBe('Start the learning guide');
    expect(contextLine).toBe('History · WWI');
  });
});
