import { z } from 'zod';

export const outcomeSummarySchema = z.object({
  accuracy: z.number().optional(),
  itemsCompleted: z.number().optional(),
  weakConcepts: z.array(z.string()).optional(),
  strongConcepts: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
});

export const sessionSchema = z.object({
  sessionId: z.string(),
  journeyId: z.string(),
  moduleId: z.string().optional(),
  activityId: z.string().optional(),
  userEmail: z.string().optional(),
  activityType: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  durationSec: z.number().optional(),
  outcomeSummary: outcomeSummarySchema.optional(),
});

export const createSessionSchema = sessionSchema.pick({
  activityType: true,
  startedAt: true,
}).extend({
  moduleId: z.string().optional(),
  activityId: z.string().optional(),
  outcomeSummary: outcomeSummarySchema.optional(),
});

export const updateSessionSchema = sessionSchema.partial().omit({
  sessionId: true,
  journeyId: true,
});
