import { describe, it, expect } from 'vitest';
import { aggregateSessionsByDay, aggregateMasteryByJourney } from './aggregateStudyStats';

function hoursAgo(h) {
  return Date.now() - h * 3600 * 1000;
}

describe('aggregateSessionsByDay', () => {
  it('returns 31 entries for 30 days', () => {
    const result = aggregateSessionsByDay([], 30);
    expect(result).toHaveLength(31);
  });

  it('counts completed sessions on their day', () => {
    const sessions = [
      { status: 'completed', startedAt: hoursAgo(2) },
      { status: 'completed', startedAt: hoursAgo(3) },
    ];
    const result = aggregateSessionsByDay(sessions, 30);
    const today = result[result.length - 1];
    expect(today.count).toBe(2);
  });

  it('ignores incomplete sessions', () => {
    const sessions = [
      { status: 'in-progress', startedAt: hoursAgo(1) },
    ];
    const result = aggregateSessionsByDay(sessions, 30);
    const today = result[result.length - 1];
    expect(today.count).toBe(0);
  });
});

describe('aggregateMasteryByJourney', () => {
  it('returns empty for no journeys', () => {
    expect(aggregateMasteryByJourney([], [])).toEqual([]);
  });

  it('computes mastery for a journey with modules', () => {
    const journeys = [{ journeyId: 'j1', title: 'Calculus' }];
    const modules = [
      { journeyId: 'j1', moduleId: 'm1', masteryScore: 75 },
      { journeyId: 'j1', moduleId: 'm2', masteryScore: 85 },
    ];
    const result = aggregateMasteryByJourney(journeys, modules);
    expect(result.length).toBe(1);
    expect(result[0].mastery).toBeGreaterThan(0);
  });
});
