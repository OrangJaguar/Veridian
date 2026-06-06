import { z } from 'zod';

export const activityTypeSchema = z.enum([
  'learningGuide',
  'practiceQuiz',
  'flashcardSet',
  'masteryCheck',
]);

export const activitySchema = z.object({
  activityId: z.string(),
  moduleId: z.string(),
  journeyId: z.string(),
  userEmail: z.string().optional(),
  type: activityTypeSchema,
  content: z.record(z.unknown()).optional(),
  itemCount: z.number().optional(),
  lastSessionAt: z.number().optional(),
});

export const createActivitySchema = activitySchema.pick({
  type: true,
}).extend({
  content: z.record(z.unknown()).optional(),
  itemCount: z.number().optional(),
});

export const updateActivitySchema = activitySchema.partial().omit({
  activityId: true,
  moduleId: true,
  journeyId: true,
});
