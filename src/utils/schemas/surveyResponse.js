import { z } from 'zod';

export const surveyInstanceSchema = z.enum(['onboarding', 'day_60']);

export const surveyResponseItemSchema = z.object({
  questionIndex: z.number().int().min(0).max(4),
  response: z.number().int().min(1).max(5),
});

export const surveyResponseSchema = z.object({
  responseId: z.string(),
  userEmail: z.string().optional(),
  surveyVersion: z.string(),
  surveyInstance: surveyInstanceSchema,
  responses: z.array(surveyResponseItemSchema),
  totalScore: z.number().int().min(0).max(25),
  accountAgeDays: z.number().int().min(0),
  wasSkipped: z.boolean(),
  createdAt: z.number(),
});
