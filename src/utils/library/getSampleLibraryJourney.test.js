import { describe, it, expect } from 'vitest';
import {
  getSampleLibraryJourney,
  getSampleLibraryJourneyHref,
} from '@/utils/library/getSampleLibraryJourney';

describe('getSampleLibraryJourney', () => {
  it('prefers Veridian-certified journeys', () => {
    const sample = getSampleLibraryJourney([
      { journeyId: 'j1', title: 'Public A' },
      { journeyId: 'j2', title: 'Certified', isVeridianCertified: true },
      { journeyId: 'j3', title: 'Featured', isFeatured: true },
    ]);
    expect(sample.journeyId).toBe('j2');
  });

  it('falls back to featured then first public', () => {
    expect(getSampleLibraryJourney([
      { journeyId: 'j1', title: 'A' },
      { journeyId: 'j2', title: 'B', isFeatured: true },
    ]).journeyId).toBe('j2');

    expect(getSampleLibraryJourney([
      { journeyId: 'j1', title: 'Only' },
    ]).journeyId).toBe('j1');
  });

  it('returns null for empty lists', () => {
    expect(getSampleLibraryJourney([])).toBeNull();
    expect(getSampleLibraryJourney()).toBeNull();
  });

  it('builds preview href or library index fallback', () => {
    expect(getSampleLibraryJourneyHref([
      { journeyId: 'j9', isVeridianCertified: true },
    ])).toBe('/library/j9');
    expect(getSampleLibraryJourneyHref([])).toBe('/library');
  });
});
