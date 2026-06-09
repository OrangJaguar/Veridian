import { z } from 'zod';

export const quizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['multipleChoice', 'trueFalse', 'multiSelect', 'shortAnswer', 'scenario', 'calculation']),
  stem: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string(),
  conceptId: z.string().optional(),
});

export const practiceQuizSessionDataSchema = z.object({
  config: z.object({
    questionCount: z.number(),
    focusPreset: z.enum(['weakSpots', 'newMaterial', 'fullReview']),
    timedMode: z.boolean(),
    timeLimitMinutes: z.number().nullable().optional(),
  }),
  questions: z.array(quizQuestionSchema),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
    timeSec: z.number().optional(),
    conceptId: z.string().optional(),
  })),
  interventions: z.array(z.object({
    conceptId: z.string(),
    shown: z.boolean(),
    accepted: z.boolean(),
  })).optional(),
});

export const flashcardSessionDataSchema = z.object({
  mode: z.enum(['due', 'browse']),
  reviews: z.array(z.object({
    cardId: z.string(),
    rating: z.enum(['again', 'hard', 'good', 'easy']),
    previousDue: z.number().optional(),
    newDue: z.number().optional(),
  })),
  counts: z.object({
    again: z.number(),
    hard: z.number(),
    good: z.number(),
    easy: z.number(),
  }),
});

export const learningGuideSessionDataSchema = z.object({
  completedSectionIds: z.array(z.string()),
  checkInResults: z.array(z.object({
    sectionId: z.string(),
    correct: z.boolean().optional(),
    response: z.string().optional(),
  })).optional(),
});

export const feynmanSessionDataSchema = z.object({
  conceptPrompt: z.string(),
  rawStudentResponse: z.string(),
  wasVoiceInput: z.boolean(),
  aiFeedback: z.string(),
  missingConcepts: z.array(z.string()).optional(),
  misconceptionsDetected: z.array(z.string()).optional(),
  weakestPoint: z.string().optional(),
  followUpQuestion: z.string().optional(),
  followUpResponse: z.string().nullable().optional(),
  overallConfidenceRating: z.enum(['strong', 'partial', 'weak']),
});

export const freeRecallSessionDataSchema = z.object({
  recallPrompt: z.string(),
  rawStudentResponse: z.string(),
  wasVoiceInput: z.boolean(),
  hintsUsed: z.number(),
  hintTiersRevealed: z.array(z.number()),
  coveragePercent: z.number(),
  conceptsCovered: z.array(z.string()).optional(),
  conceptsMissed: z.array(z.string()).optional(),
  incorrectIdeas: z.array(z.string()).optional(),
  aiGradingSummary: z.string().optional(),
  nextConceptRecommendation: z.string().optional(),
});

export const synthesisSessionDataSchema = z.object({
  modulesInvolved: z.array(z.string()),
  questions: z.array(quizQuestionSchema),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
  })),
  crossModuleConfusionNotes: z.string().optional(),
  integrationReadinessSignal: z.enum(['strong', 'partial', 'weak']).optional(),
});

export const interleavedSessionDataSchema = z.object({
  selectedModuleIds: z.array(z.string()),
  questions: z.array(quizQuestionSchema),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
  })),
  perModuleAccuracy: z.record(z.number()).optional(),
  weakModulesUnderMixing: z.array(z.string()).optional(),
  crossModuleConfusionNotes: z.string().optional(),
});

export const journeyChallengeSessionDataSchema = interleavedSessionDataSchema.extend({
  overallReadinessSignal: z.enum(['examReady', 'nearlyReady', 'notReady']).optional(),
  recommendedStudyPlan: z.string().optional(),
});

export const cramSessionDataSchema = z.object({
  itemsCompleted: z.number(),
  weakConcepts: z.array(z.string()).optional(),
  dangerousAreas: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
  flashcardReviews: z.number().optional(),
  quizQuestions: z.number().optional(),
});
