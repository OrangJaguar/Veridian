import { z } from 'zod';

export const activityScopeSchema = z.enum(['module', 'journey']);

export const activityStatusSchema = z.enum([
  'notGenerated',
  'generating',
  'ready',
  'failed',
]);

export const activityTypeSchema = z.enum([
  'learningGuide',
  'practiceQuiz',
  'flashcardSet',
  'feynman',
  'freeRecall',
  'interleavedReview',
  'journeyChallenge',
  'diagnostic',
]);

export const activityStatsSchema = z.object({
  totalSessions: z.number().optional(),
  avgAccuracy: z.number().optional(),
  lastScore: z.number().optional(),
  lastCompletedAt: z.number().optional(),
  dueCount: z.number().optional(),
});

export const activitySchema = z.object({
  activityId: z.string(),
  moduleId: z.string().nullable().optional(),
  journeyId: z.string(),
  userEmail: z.string().optional(),
  scope: activityScopeSchema,
  type: activityTypeSchema,
  status: activityStatusSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  stats: activityStatsSchema.optional(),
  itemCount: z.number().optional(),
  lastSessionAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const createActivitySchema = activitySchema.pick({
  type: true,
  scope: true,
  status: true,
}).extend({
  activityId: z.string().optional(),
  moduleId: z.string().nullable().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  stats: activityStatsSchema.optional(),
  itemCount: z.number().optional(),
});

export const updateActivitySchema = activitySchema.partial().omit({
  activityId: true,
  journeyId: true,
});
