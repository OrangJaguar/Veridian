import { describe, it, expect } from 'vitest';
import {
  failureModeToActivity,
  failureModeToActivityFromMatrix,
} from '@/utils/study/diagnosticWeakness';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

describe('failureModeToActivity', () => {
  it.each(FAILURE_MODE_IDS)('matrix maps mode %s at stage B', (modeId) => {
    const fromMatrix = failureModeToActivityFromMatrix(modeId, 'B');
    expect(fromMatrix).toBeTruthy();
    expect(failureModeToActivity(modeId, 'B')).toBe(fromMatrix);
  });

  it('maps transfer_failure stage C to freeRecall via matrix', () => {
    expect(failureModeToActivity('transfer_failure', 'C')).toBe('freeRecall');
  });

  it('maps verbatim_trap stage B to practiceQuiz via matrix', () => {
    expect(failureModeToActivity('verbatim_trap', 'B')).toBe('practiceQuiz');
  });

  it('maps retention_decay to flashcardSet', () => {
    expect(failureModeToActivity('retention_decay', 'B')).toBe('flashcardSet');
  });
});
