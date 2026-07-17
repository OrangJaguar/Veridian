import { describe, it, expect } from 'vitest';
import { searchAndRank } from './searchAndRank';

const INDEX = [
  { id: 'j-1', type: 'journey', text: 'organic chemistry basics', label: 'Organic Chemistry', sublabel: '', href: '/journeys/1', journeyId: '1' },
  { id: 'm-1', type: 'module', text: 'alkanes and alkenes module', label: 'Alkanes and Alkenes', sublabel: 'Organic Chemistry', href: '/journeys/1/modules/m1', journeyId: '1', moduleId: 'm1' },
  { id: 'c-1', type: 'card', text: 'what is an alkane? a saturated hydrocarbon', label: 'What is an alkane?', sublabel: 'Organic Chemistry', href: '/journeys/1', journeyId: '1', cardId: 'c1' },
  { id: 'j-2', type: 'journey', text: 'calculus ii integrals', label: 'Calculus II', sublabel: '', href: '/journeys/2', journeyId: '2' },
  { id: 'm-2', type: 'module', text: 'integration techniques module', label: 'Integration Techniques', sublabel: 'Calculus II', href: '/journeys/2/modules/m2', journeyId: '2', moduleId: 'm2' },
];

describe('searchAndRank', () => {
  it('returns empty tiers when query is empty', () => {
    const r = searchAndRank(INDEX, '');
    expect(r.journeys).toHaveLength(0);
    expect(r.modules).toHaveLength(0);
    expect(r.cards).toHaveLength(0);
  });

  it('finds a journey by partial match', () => {
    const r = searchAndRank(INDEX, 'organic');
    expect(r.journeys).toHaveLength(1);
    expect(r.journeys[0].label).toBe('Organic Chemistry');
  });

  it('finds matching modules and cards', () => {
    const r = searchAndRank(INDEX, 'alkane');
    expect(r.modules.length).toBeGreaterThanOrEqual(1);
    expect(r.cards.length).toBeGreaterThanOrEqual(1);
  });

  it('sets highlight indices on label matches', () => {
    const r = searchAndRank(INDEX, 'calculus');
    expect(r.journeys[0].labelMatchStart).toBe(0);
    expect(r.journeys[0].labelMatchEnd).toBe(8);
  });

  it('deduplicates items with the same label', () => {
    const duped = [
      ...INDEX,
      { id: 'j-3', type: 'journey', text: 'organic chemistry advanced', label: 'Organic Chemistry', sublabel: '', href: '/journeys/3', journeyId: '3' },
    ];
    const r = searchAndRank(duped, 'organic');
    expect(r.journeys).toHaveLength(1);
  });

  it('tiers results correctly: journeys > modules > cards', () => {
    const r = searchAndRank(INDEX, 'alka');
    expect(r.journeys).toHaveLength(0);
    expect(r.modules.length).toBeGreaterThanOrEqual(1);
    expect(r.cards.length).toBeGreaterThanOrEqual(1);
  });
});
