import { z } from 'zod';
import { FAILURE_MODE_IDS } from '@/utils/failures/constants';

const failureModeEnum = z.enum(
  /** @type {[string, ...string[]]} */ ([...FAILURE_MODE_IDS]),
);

export const conceptResultStatusSchema = z.enum([
  'solid',
  'shaky',
  'needs_work',
  'skipped',
]);

export const conceptResultSchema = z.object({
  conceptId: z.string(),
  term: z.string().optional(),
  attempts: z.number().int().min(0),
  correct: z.number().int().min(0),
  skipped: z.number().int().min(0).optional(),
  accuracy: z.number().min(0).max(100).nullable(),
  avgTimeSec: z.number().nullable().optional(),
  status: conceptResultStatusSchema,
  questionIds: z.array(z.string()).optional(),
});

export const sessionTrapHitSchema = z.object({
  modeId: failureModeEnum,
  hits: z.number().int().min(1),
  conceptIds: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

export const sessionTrapDebriefSchema = z.object({
  sessionHits: z.array(sessionTrapHitSchema),
  primaryMode: failureModeEnum.nullable(),
  primaryConfidence: z.enum(['emerging', 'confirmed']).nullable().optional(),
  cumulativePrimaryMode: failureModeEnum.nullable().optional(),
  cumulativeConfidence: z.enum(['emerging', 'confirmed']).nullable().optional(),
  advice: z.string().nullable().optional(),
  suppressed: z.boolean().optional(),
  suppressionReason: z.string().nullable().optional(),
});

export const nextActivitySchema = z.object({
  activityId: z.string().optional(),
  activityType: z.string(),
  reasonCode: z.string().optional(),
  prescriptionType: z.string().nullable().optional(),
  primaryMode: z.string().nullable().optional(),
  reason: z.string(),
  estimatedMin: z.number().optional(),
  label: z.string().optional(),
  quizConfig: z.record(z.unknown()).nullable().optional(),
  flashcardMode: z.string().nullable().optional(),
  mixedPhrasing: z.boolean().optional(),
  timed: z.boolean().optional(),
  prescription: z.record(z.unknown()).nullable().optional(),
  moduleId: z.string().nullable().optional(),
  journeyId: z.string().optional(),
}).passthrough();

/** Backward-compatible outcome summary used across study modes. */
export const outcomeSummarySchema = z.object({
  accuracy: z.number().optional(),
  itemsCompleted: z.number().optional(),
  weakConcepts: z.array(z.string()).optional(),
  strongConcepts: z.array(z.string()).optional(),
  /** Legacy free-form string; prefer nextActivity. */
  nextAction: z.string().optional(),
  conceptResults: z.array(conceptResultSchema).optional(),
  trapDebrief: sessionTrapDebriefSchema.optional(),
  nextActivity: nextActivitySchema.optional(),
}).passthrough();

export const planTrustFactorSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  detail: z.string().optional(),
  weight: z.enum(['high', 'medium', 'low']).optional(),
});
