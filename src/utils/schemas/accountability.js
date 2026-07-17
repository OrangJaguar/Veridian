import { z } from 'zod';

export const planOverrideActionSchema = z.enum([
  'skip',
  'snooze',
  'swap',
  'move',
  'pin',
]);

export const planOverrideSchema = z.object({
  overrideId: z.string(),
  userEmail: z.string().optional(),
  assignmentId: z.string(),
  weekKey: z.string(),
  originalDateKey: z.string(),
  action: planOverrideActionSchema,
  /** For snooze/move: target date YYYY-MM-DD */
  targetDateKey: z.string().nullable().optional(),
  /** For swap: replacement activity type */
  swapActivityType: z.string().nullable().optional(),
  /** For swap: replacement activity id */
  swapActivityId: z.string().nullable().optional(),
  journeyId: z.string().optional(),
  moduleId: z.string().nullable().optional(),
  activityId: z.string().optional(),
  expiresAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  active: z.boolean().optional(),
});

export const createPlanOverrideSchema = planOverrideSchema.omit({
  userEmail: true,
}).partial({
  overrideId: true,
  createdAt: true,
  active: true,
});

export const commitmentStatusSchema = z.enum([
  'planned',
  'started',
  'completed',
  'skipped',
  'missed',
  'cancelled',
]);

export const commitmentSourceSchema = z.enum([
  'plan',
  'manual',
  'schedule_next',
  'recovery',
]);

export const studyCommitmentSchema = z.object({
  commitmentId: z.string(),
  userEmail: z.string().optional(),
  assignmentId: z.string().nullable().optional(),
  weekKey: z.string(),
  journeyId: z.string(),
  moduleId: z.string().nullable().optional(),
  activityId: z.string(),
  activityType: z.string().optional(),
  scheduledDateKey: z.string(),
  estimatedMin: z.number().optional(),
  source: commitmentSourceSchema.optional(),
  status: commitmentStatusSchema,
  sessionId: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
  completedAt: z.number().nullable().optional(),
});

export const createStudyCommitmentSchema = studyCommitmentSchema.omit({
  userEmail: true,
}).partial({
  commitmentId: true,
  createdAt: true,
  status: true,
});

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const weekdayEnumSchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const reminderTriggersSchema = z.object({
  commitment: z.boolean().optional(),
  dueWork: z.boolean().optional(),
  exam: z.boolean().optional(),
  unfinished: z.boolean().optional(),
}).partial();

/** Extended accountability preference fields. */
export const accountabilityPreferencesSchema = z.object({
  timezone: z.string().optional(),
  weeklyTargetSessions: z.number().int().min(0).max(21).optional(),
  weeklyTargetMinutes: z.number().int().min(0).max(1500).optional(),
  preferredStudyDays: z.array(weekdayEnumSchema).optional(),
  unavailableWeekdays: z.array(weekdayEnumSchema).optional(),
  reminderLocalHour: z.number().int().min(0).max(23).optional(),
  reminderTriggers: reminderTriggersSchema.optional(),
  commitmentWeekKey: z.string().nullable().optional(),
  commitmentAcceptedAt: z.number().nullable().optional(),
});
