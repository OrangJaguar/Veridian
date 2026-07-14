import { describe, it, expect } from 'vitest';
import {
  getFailureModeIcon,
  getFailureModeClassName,
  getFailureModeCssToken,
  allModesHaveVisuals,
} from '@/utils/failures/failureModeVisuals';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

describe('failureModeVisuals', () => {
  it.each(FAILURE_MODE_IDS)('provides icon for mode %s', (modeId) => {
    const Icon = getFailureModeIcon(modeId);
    expect(Icon).toBeTruthy();
    expect(['function', 'object']).toContain(typeof Icon);
  });

  it.each(FAILURE_MODE_IDS)('provides class name for mode %s', (modeId) => {
    expect(getFailureModeClassName(modeId)).toBe(`failure-mode--${modeId}`);
  });

  it.each(FAILURE_MODE_IDS)('provides CSS token for mode %s', (modeId) => {
    expect(getFailureModeCssToken(modeId)).toBe(`--failure-${modeId}`);
  });

  it('allModesHaveVisuals returns true', () => {
    expect(allModesHaveVisuals()).toBe(true);
  });

  it('falls back for unknown mode', () => {
    expect(getFailureModeClassName('unknown')).toBe('failure-mode--unknown');
    expect(getFailureModeIcon('unknown')).toBeTruthy();
  });
});
