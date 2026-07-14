import { z } from 'zod';
import { MIX_CATEGORIES, QUESTION_TYPES, VARIANT_TYPES } from '@/utils/quiz/questionTypes';

const sharedMeta = {
  id: z.string(),
  stem: z.string(),
  explanation: z.string(),
  conceptId: z.string().optional(),
  moduleId: z.string().optional(),
  variantType: z.enum(VARIANT_TYPES).optional(),
  mixCategory: z.enum(MIX_CATEGORIES).optional(),
};

export const multipleChoiceQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('multipleChoice'),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string(),
});

export const trueFalseQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('trueFalse'),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
});

export const shortAnswerQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('shortAnswer'),
  correctAnswer: z.string(),
  acceptableAnswers: z.array(z.string()).optional(),
  matchMode: z.enum(['fuzzy', 'exact']).optional(),
});

export const multiSelectQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('multiSelect'),
  options: z.array(z.string()).min(2),
  correctAnswer: z.array(z.string()).min(1),
});

export const orderingQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('ordering'),
  items: z.array(z.string()).min(2),
  options: z.array(z.string()).optional(),
  correctAnswer: z.array(z.string()).min(2),
});

export const matchingQuestionSchema = z.object({
  ...sharedMeta,
  type: z.literal('matching'),
  leftItems: z.array(z.string()).min(2),
  rightItems: z.array(z.string()).min(2),
  correctAnswer: z.record(z.string(), z.string()),
});

export const quizQuestionUnionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema,
  trueFalseQuestionSchema,
  shortAnswerQuestionSchema,
  multiSelectQuestionSchema,
  orderingQuestionSchema,
  matchingQuestionSchema,
]);

export const quizAnswerResponseSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.record(z.string(), z.string()),
]);

export function parseQuizQuestion(raw) {
  if (!raw?.explanation) {
    raw = { ...raw, explanation: raw?.explanation || 'Review the key concepts.' };
  }
  const result = quizQuestionUnionSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseQuizQuestions(list) {
  if (!Array.isArray(list)) return [];
  return list.map(parseQuizQuestion).filter(Boolean);
}
