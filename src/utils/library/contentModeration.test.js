import { describe, it, expect } from 'vitest';
import { moderateTexts, scanJourneyForModeration } from '@/utils/library/contentModeration';

describe('contentModeration', () => {
  it('allows clean educational content', () => {
    const result = moderateTexts([
      { field: 'title', text: 'AP Biology — Cell Structure' },
      { field: 'subject', text: 'Biology' },
    ]);
    expect(result.allowed).toBe(true);
  });

  it('blocks obvious profanity', () => {
    const result = moderateTexts([{ field: 'title', text: 'Learn fucking mitosis' }]);
    expect(result.allowed).toBe(false);
    expect(result.issues[0].field).toBe('title');
  });

  it('blocks spaced-out combinations', () => {
    const result = moderateTexts([{ field: 'module', text: 'fu ck this topic' }]);
    expect(result.allowed).toBe(false);
  });

  it('blocks leetspeak variants', () => {
    const result = moderateTexts([{ field: 'tag', text: 'sh1t review' }]);
    expect(result.allowed).toBe(false);
  });

  it('scans journey modules and tags', () => {
    const result = scanJourneyForModeration({
      journey: { title: 'Calculus', subject: 'Math', tags: ['exam'] },
      modules: [{ name: 'Limits', description: 'Intro to limits', concepts: [{ term: 'derivative' }] }],
      tags: ['badword shit'],
    });
    expect(result.allowed).toBe(false);
  });
});
