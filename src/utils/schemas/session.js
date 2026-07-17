import { z } from 'zod';
import { outcomeSummarySchema } from '@/utils/schemas/studyIntelligence';

export { outcomeSummarySchema };
export {
  conceptResultSchema,
  sessionTrapDebriefSchema,
  nextActivitySchema,
} from '@/utils/schemas/studyIntelligence';

export const sessionStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);

export const sessionSchema = z.object({
  sessionId: z.string(),
  journeyId: z.string(),
  moduleId: z.string().optional(),
  activityId: z.string(),
  userEmail: z.string().optional(),
  activityType: z.string(),
  status: sessionStatusSchema,
  score: z.number().optional(),
  sessionData: z.record(z.unknown()).optional(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  durationSec: z.number().optional(),
  sessionDurationMs: z.number().optional(),
  hintsUsed: z.number().optional(),
  questionsAnswered: z.number().optional(),
  accuracyPercent: z.number().optional(),
  timePerQuestion: z.array(z.number()).optional(),
  abandonedAt: z.number().optional(),
  outcomeSummary: outcomeSummarySchema.optional(),
});

export const createSessionSchema = sessionSchema.pick({
  activityType: true,
  activityId: true,
  startedAt: true,
  status: true,
}).extend({
  moduleId: z.string().optional(),
  score: z.number().optional(),
  sessionData: z.record(z.unknown()).optional(),
  outcomeSummary: outcomeSummarySchema.optional(),
});

export const updateSessionSchema = sessionSchema.partial().omit({
  sessionId: true,
  journeyId: true,
});
