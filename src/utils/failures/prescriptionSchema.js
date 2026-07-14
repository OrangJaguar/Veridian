import { z } from 'zod';
import { MIX_CATEGORIES, QUESTION_TYPES, VARIANT_TYPES } from '@/utils/quiz/questionTypes';

export const quizConfigSchema = z.object({
  questionCount: z.number(),
  focusPreset: z.enum(['weakSpots', 'newMaterial', 'fullReview']),
  timedMode: z.boolean().optional(),
  timeLimitMinutes: z.number().nullable().optional(),
  uiPreset: z.string().optional(),
  questionStyle: z.string().optional(),
  strictMode: z.boolean().optional(),
  strictTimedMode: z.boolean().optional(),
}).passthrough();

export const compositionSlotSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  mixCategory: z.enum(MIX_CATEGORIES).optional(),
  variantType: z.enum(VARIANT_TYPES).optional(),
  conceptId: z.string().optional(),
  pairedConceptId: z.string().optional(),
  timedFriendly: z.boolean().optional(),
});

export const compositionPlanSchema = z.object({
  totalCount: z.number(),
  prescriptionType: z.string().nullable().optional(),
  slots: z.array(compositionSlotSchema),
  uiPresetRecommendation: z.enum(['classic', 'apClassroom']).optional(),
  timedDefault: z.boolean().optional(),
});

export const prescriptionSpecSchema = z.object({
  prescriptionType: z.string(),
  activityType: z.string(),
  questionMix: z.record(z.string(), z.number()).optional(),
  timed: z.boolean().optional(),
  flashcardMode: z.string().optional(),
}).passthrough();

export const sessionPrescriptionSchema = z.object({
  prescriptionType: z.string().optional(),
  primaryMode: z.string().nullable().optional(),
  summary: z.string().optional(),
  compositionPlan: compositionPlanSchema.optional(),
});
