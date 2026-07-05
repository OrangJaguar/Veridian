import { z } from 'zod';

export const moduleStageSchema = z.enum(['A', 'B', 'C']);

export const moduleSchema = z.object({
  moduleId: z.string(),
  journeyId: z.string(),
  userEmail: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  stage: moduleStageSchema.optional(),
  masteryScore: z.number().min(0).max(100).optional(),
  knowledgeMap: z.record(z.unknown()).optional(),
  lastStudiedAt: z.number().optional(),
  libraryVisible: z.boolean().optional(),
  moduleStatus: z.enum(['draft', 'ready']).optional(),
  estimatedStudyMinutes: z.number().optional(),
  baselineScore: z.number().min(0).max(100).nullable().optional(),
  baselineCapturedAt: z.number().nullable().optional(),
  baselineSkipped: z.boolean().optional(),
  firstQuizAt: z.number().nullable().optional(),
  timedBaselineCapturedAt: z.number().nullable().optional(),
});

export const createModuleSchema = moduleSchema.pick({
  name: true,
  order: true,
}).extend({
  description: z.string().optional(),
  stage: moduleStageSchema.optional(),
});

export const updateModuleSchema = moduleSchema.partial().omit({ moduleId: true, journeyId: true });
