import { describe, it, expect } from 'vitest';
import {
  buildAssignmentId,
  parseAssignmentId,
  stampSnapshotAssignmentIds,
} from '@/utils/planner/assignmentId';
import {
  applyPlanOverrides,
  applyRecoveryRepack,
} from '@/utils/planner/applyPlanOverrides';
import {
  computeCommitmentAdherence,
  commitmentsFromPlanSnapshot,
} from '@/utils/accountability/computeCommitmentAdherence';
import { normalizeNotificationPref } from '@/utils/schemas/preferences';
import { buildLaunchSessionData } from '@/utils/planner/buildLaunchSessionData';

function sampleSnapshot() {
  return {
    weekKey: '2026-W29',
    dailyBudgetMin: 45,
    days: [
      {
        dayIndex: 0,
        dateKey: '2026-07-13',
        assignments: [
          {
            journeyId: 'j1',
            moduleId: 'm1',
            activityId: 'a1',
            activityType: 'practiceQuiz',
            moduleName: 'Cells',
            estimatedMin: 15,
            reasonCode: 'weak_quiz',
          },
          {
            journeyId: 'j1',
            moduleId: 'm2',
            activityId: 'a2',
            activityType: 'flashcardSet',
            moduleName: 'DNA',
            estimatedMin: 10,
            reasonCode: 'flashcard_review',
          },
        ],
        fsrsCardCount: 0,
      },
      {
        dayIndex: 1,
        dateKey: '2026-07-14',
        assignments: [],
        fsrsCardCount: 0,
      },
      {
        dayIndex: 2,
        dateKey: '2026-07-15',
        assignments: [
          {
            journeyId: 'j1',
            moduleId: 'm1',
            activityId: 'a3',
            activityType: 'learningGuide',
            moduleName: 'Cells',
            estimatedMin: 15,
            reasonCode: 'guide_incomplete',
          },
        ],
        fsrsCardCount: 0,
      },
    ],
  };
}

describe('assignmentId stability', () => {
  it('builds and parses deterministic ids', () => {
    const id = buildAssignmentId({
      weekKey: '2026-W29',
      dateKey: '2026-07-13',
      journeyId: 'j1',
      moduleId: 'm1',
      activityId: 'a1',
      slot: 0,
    });
    expect(id).toBe('2026-W29|2026-07-13|j1|m1|a1|0');
    expect(parseAssignmentId(id)).toEqual({
      weekKey: '2026-W29',
      dateKey: '2026-07-13',
      journeyId: 'j1',
      moduleId: 'm1',
      activityId: 'a1',
      slot: 0,
    });
  });

  it('stamps stable ids across snapshot days', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const ids = stamped.days.flatMap((d) => d.assignments.map((a) => a.assignmentId));
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toContain('2026-W29|2026-07-13|j1|m1|a1|0');
  });
});

describe('applyPlanOverrides', () => {
  it('skips an assignment without mutating base identity of others', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const targetId = stamped.days[0].assignments[0].assignmentId;
    const next = applyPlanOverrides(stamped, [{
      assignmentId: targetId,
      weekKey: '2026-W29',
      action: 'skip',
      active: true,
    }]);
    expect(next.days[0].assignments).toHaveLength(1);
    expect(next.days[0].assignments[0].activityId).toBe('a2');
    expect(stamped.days[0].assignments).toHaveLength(2);
  });

  it('pins survive unavailable weekdays; unpinned do not', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const pinId = stamped.days[0].assignments[0].assignmentId;
    const next = applyPlanOverrides(
      stamped,
      [{ assignmentId: pinId, weekKey: '2026-W29', action: 'pin', active: true }],
      { unavailableWeekdays: ['mon'] },
    );
    expect(next.days[0].unavailable).toBe(true);
    expect(next.days[0].assignments).toHaveLength(1);
    expect(next.days[0].assignments[0].pinned).toBe(true);
  });

  it('snooze moves work to target day', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const id = stamped.days[0].assignments[0].assignmentId;
    const next = applyPlanOverrides(stamped, [{
      assignmentId: id,
      weekKey: '2026-W29',
      action: 'snooze',
      targetDateKey: '2026-07-14',
      active: true,
    }]);
    expect(next.days[0].assignments.find((a) => a.assignmentId === id)).toBeUndefined();
    expect(next.days[1].assignments.some((a) => a.assignmentId === id)).toBe(true);
  });

  it('swap changes activity type', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const id = stamped.days[0].assignments[0].assignmentId;
    const next = applyPlanOverrides(stamped, [{
      assignmentId: id,
      weekKey: '2026-W29',
      action: 'swap',
      swapActivityType: 'freeRecall',
      swapActivityId: 'a1',
      active: true,
    }]);
    expect(next.days[0].assignments[0].activityType).toBe('freeRecall');
  });
});

describe('applyRecoveryRepack', () => {
  it('moves unpinned future work earlier while preserving pins', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const pinId = stamped.days[2].assignments[0].assignmentId;
    const withPin = applyPlanOverrides(stamped, [{
      assignmentId: pinId,
      weekKey: '2026-W29',
      action: 'pin',
      active: true,
    }]);
    const recovered = applyRecoveryRepack(withPin, {
      fromDateKey: '2026-07-13',
      dailyBudgetMin: 60,
    });
    const wed = recovered.days.find((d) => d.dateKey === '2026-07-15');
    expect(wed.assignments.some((a) => a.assignmentId === pinId && a.pinned)).toBe(true);
  });
});

describe('commitment adherence', () => {
  it('computes adherence from durable commitments', () => {
    const summary = computeCommitmentAdherence([
      { weekKey: '2026-W29', status: 'completed', estimatedMin: 15, scheduledDateKey: '2026-07-13' },
      { weekKey: '2026-W29', status: 'planned', estimatedMin: 15, scheduledDateKey: '2026-07-14' },
      { weekKey: '2026-W29', status: 'missed', estimatedMin: 10, scheduledDateKey: '2026-07-12' },
      { weekKey: '2026-W29', status: 'cancelled', estimatedMin: 10, scheduledDateKey: '2026-07-11' },
    ], { weekKey: '2026-W29', todayKey: '2026-07-15' });
    expect(summary.planned).toBe(3);
    expect(summary.completed).toBe(1);
    expect(summary.missed).toBe(2); // explicit missed + overdue planned
    expect(summary.adherencePercent).toBe(33);
  });

  it('builds commitment payloads from plan snapshot', () => {
    const stamped = stampSnapshotAssignmentIds(sampleSnapshot());
    const payloads = commitmentsFromPlanSnapshot(stamped);
    expect(payloads).toHaveLength(3);
    expect(payloads[0].source).toBe('plan');
    expect(payloads[0].assignmentId).toBeTruthy();
  });
});

describe('notification pref normalization', () => {
  it('maps legacy daily to weekly', () => {
    expect(normalizeNotificationPref('daily')).toBe('weekly');
    expect(normalizeNotificationPref('weekly')).toBe('weekly');
    expect(normalizeNotificationPref('off')).toBe('off');
    expect(normalizeNotificationPref(undefined)).toBe('off');
  });
});

describe('launch payload assignment linking', () => {
  it('includes assignment and commitment ids', () => {
    const data = buildLaunchSessionData({
      assignmentId: 'w|d|j|m|a|0',
      commitmentId: 'c1',
      weekKey: '2026-W29',
      dateKey: '2026-07-13',
    });
    expect(data.assignmentId).toBe('w|d|j|m|a|0');
    expect(data.commitmentId).toBe('c1');
    expect(data.weekKey).toBe('2026-W29');
  });
});
