import { z } from 'zod';

export const errorSourceSchema = z.enum(['client', 'server']);
export const errorEnvironmentSchema = z.enum(['production', 'staging', 'development']);
export const errorGroupStatusSchema = z.enum(['open', 'resolved', 'ignored']);

export const errorGroupSchema = z.object({
  groupId: z.string(),
  message: z.string(),
  stackSample: z.string().optional(),
  source: errorSourceSchema.optional(),
  route: z.string().optional(),
  environment: errorEnvironmentSchema.optional(),
  occurrenceCount: z.number().optional(),
  distinctUserCount: z.number().optional(),
  distinctUserEmails: z.array(z.string()).optional(),
  firstSeenAt: z.number().optional(),
  lastSeenAt: z.number().optional(),
  lastAlertedAt: z.number().optional(),
  alertThresholdsSent: z.array(z.string()).optional(),
  status: errorGroupStatusSchema.optional(),
});

export const errorOccurrenceSchema = z.object({
  occurrenceId: z.string(),
  groupId: z.string(),
  message: z.string(),
  stack: z.string().optional(),
  route: z.string().optional(),
  environment: errorEnvironmentSchema.optional(),
  source: errorSourceSchema.optional(),
  userEmail: z.string().optional(),
  userId: z.string().optional(),
  clientInfo: z.record(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});

export const feedbackTypeSchema = z.enum(['bug', 'feature', 'general']);

export const feedbackSubmissionSchema = z.object({
  submissionId: z.string(),
  type: feedbackTypeSchema,
  message: z.string(),
  replyEmail: z.string().optional(),
  userEmail: z.string().optional(),
  route: z.string().optional(),
  clientInfo: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});

export const logAppErrorPayloadSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  route: z.string().max(500).optional(),
  source: errorSourceSchema.default('client'),
  environment: errorEnvironmentSchema.optional(),
  context: z.record(z.unknown()).optional(),
  clientInfo: z.record(z.unknown()).optional(),
});

export const submitFeedbackPayloadSchema = z.object({
  type: feedbackTypeSchema,
  message: z.string().min(10).max(2000),
  replyEmail: z.string().email().optional().or(z.literal('')),
  route: z.string().max(500).optional(),
  clientInfo: z.record(z.unknown()).optional(),
});
