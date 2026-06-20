import { describe, expect, it } from 'vitest';
import {
  matchAdminQueryIntent,
  normalizeQuizSetupConfig,
} from '@/utils/admin/adminQueryEngine';

describe('matchAdminQueryIntent', () => {
  it('matches signup week queries', () => {
    expect(matchAdminQueryIntent('How many users signed up this week?')).toBe('signupsWeek');
  });

  it('matches popular subject queries', () => {
    expect(matchAdminQueryIntent('What is the most popular subject?')).toBe('popularSubject');
  });

  it('matches average mastery queries', () => {
    expect(matchAdminQueryIntent('What is the average mastery score?')).toBe('avgMastery');
  });

  it('returns unknown for unrelated queries', () => {
    expect(matchAdminQueryIntent('What is the weather?')).toBe('unknown');
  });
});

describe('normalizeQuizSetupConfig', () => {
  it('defaults uiPreset and questionStyle', () => {
    expect(normalizeQuizSetupConfig({})).toMatchObject({
      uiPreset: 'classic',
      questionStyle: 'standard',
    });
  });

  it('preserves AP presets', () => {
    expect(normalizeQuizSetupConfig({
      uiPreset: 'apClassroom',
      questionStyle: 'apStyle',
    })).toMatchObject({
      uiPreset: 'apClassroom',
      questionStyle: 'apStyle',
    });
  });

  it('coerces invalid preset values to defaults', () => {
    expect(normalizeQuizSetupConfig({
      uiPreset: 'invalid',
      questionStyle: 'other',
    })).toMatchObject({
      uiPreset: 'classic',
      questionStyle: 'standard',
    });
  });
});
