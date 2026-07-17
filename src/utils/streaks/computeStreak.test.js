import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeStreak } from './computeStreak';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

function makeSession(daysOffset) {
  return { status: 'completed', startedAt: daysAgo(daysOffset) };
}

describe('computeStreak', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns zeros for empty sessions', () => {
    const r = computeStreak([]);
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(0);
    expect(r.todayCompleted).toBe(false);
  });

  it('counts a single session today as streak 1', () => {
    const r = computeStreak([makeSession(0)]);
    expect(r.currentStreak).toBe(1);
    expect(r.todayCompleted).toBe(true);
  });

  it('counts consecutive days', () => {
    const sessions = [makeSession(0), makeSession(1), makeSession(2)];
    const r = computeStreak(sessions);
    expect(r.currentStreak).toBe(3);
  });

  it('breaks on a gap day', () => {
    const sessions = [makeSession(0), makeSession(1), makeSession(3)];
    const r = computeStreak(sessions);
    expect(r.currentStreak).toBe(2);
    expect(r.longestStreak).toBe(2);
  });

  it('tracks longest streak separately', () => {
    const sessions = [
      makeSession(0), makeSession(1),
      makeSession(5), makeSession(6), makeSession(7), makeSession(8),
    ];
    const r = computeStreak(sessions);
    expect(r.currentStreak).toBe(2);
    expect(r.longestStreak).toBe(4);
  });

  it('counts streak from yesterday if no session today', () => {
    const sessions = [makeSession(1), makeSession(2)];
    const r = computeStreak(sessions);
    expect(r.currentStreak).toBe(2);
    expect(r.todayCompleted).toBe(false);
  });

  it('ignores non-completed sessions', () => {
    const sessions = [
      { status: 'in-progress', startedAt: daysAgo(0) },
      makeSession(1),
    ];
    const r = computeStreak(sessions);
    expect(r.currentStreak).toBe(1);
  });
});
