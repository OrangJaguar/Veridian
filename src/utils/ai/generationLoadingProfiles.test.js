import { describe, expect, it } from 'vitest';
import { getGenerationLoadingProfile } from '@/utils/ai/generationLoadingProfiles';

describe('getGenerationLoadingProfile', () => {
  it('returns short mode for practice questions', () => {
    const profile = getGenerationLoadingProfile('generatePracticeQuestions');
    expect(profile.mode).toBe('short');
    expect(profile.steps.length).toBeGreaterThan(0);
  });

  it('returns long mode for learning guide generation', () => {
    const profile = getGenerationLoadingProfile('generateLearningGuide');
    expect(profile.mode).toBe('long');
    expect(profile.steps.length).toBeGreaterThan(2);
  });

  it('falls back for unknown actions', () => {
    const profile = getGenerationLoadingProfile('unknownAction');
    expect(profile.label).toBeTruthy();
    expect(['short', 'long']).toContain(profile.mode);
  });
});
