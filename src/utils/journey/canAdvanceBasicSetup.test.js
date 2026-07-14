import { describe, it, expect } from 'vitest';
import { canAdvanceBasicSetup } from '@/utils/journey/canAdvanceBasicSetup';
import { JOURNEY_SUBJECT_OPTIONS } from '@/lib/journeySubjects';

describe('canAdvanceBasicSetup', () => {
  const base = {
    title: 'AP Chemistry Basics',
    subject: JOURNEY_SUBJECT_OPTIONS[0],
    examDate: null,
  };

  it('allows open learning without examDate', () => {
    expect(canAdvanceBasicSetup(base, { hasExamDate: false })).toBe(true);
  });

  it('requires examDate when exam mode selected', () => {
    expect(canAdvanceBasicSetup(base, { hasExamDate: true })).toBe(false);
    expect(canAdvanceBasicSetup({
      ...base,
      examDate: Date.now() + 86400000,
    }, { hasExamDate: true })).toBe(true);
  });

  it('rejects invalid title', () => {
    expect(canAdvanceBasicSetup({ ...base, title: 'ab' }, { hasExamDate: false })).toBe(false);
  });
});
