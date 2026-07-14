import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

describe('journeyScaffold', () => {
  it('does not scaffold interleavedReview on new journeys', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const src = readFileSync(join(dir, 'journeyScaffold.js'), 'utf8');
    expect(src).not.toMatch(/interleavedReview/);
    expect(src).toMatch(/journeyChallenge/);
    expect(src).toMatch(/cramSession/);
  });
});
