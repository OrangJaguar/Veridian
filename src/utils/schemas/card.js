import { z } from 'zod';

export const fsrsStateSchema = z.object({
  stability: z.number().optional(),
  difficulty: z.number().optional(),
  due: z.number().optional(),
  reps: z.number().optional(),
  lapses: z.number().optional(),
  state: z.number().optional(),
  lastReview: z.number().optional(),
  elapsed_days: z.number().optional(),
  scheduled_days: z.number().optional(),
  learning_steps: z.number().optional(),
});

export const cardSchema = z.object({
  cardId: z.string(),
  activityId: z.string(),
  journeyId: z.string(),
  userEmail: z.string().optional(),
  front: z.string(),
  back: z.string(),
  conceptTag: z.string().optional(),
  fsrsState: fsrsStateSchema.optional(),
  suspended: z.boolean().optional(),
});

export const createCardSchema = cardSchema.pick({
  front: true,
  back: true,
}).extend({
  conceptTag: z.string().optional(),
  fsrsState: fsrsStateSchema.optional(),
});

export const updateCardSchema = cardSchema.partial().omit({
  cardId: true,
  activityId: true,
  journeyId: true,
});
