import { z } from 'zod';
import { quizConfigSchema } from '@/utils/failures/prescriptionSchema';
import { quizQuestionUnionSchema, quizAnswerResponseSchema } from '@/utils/quiz/questionSchemas';

export const confidenceSliderSchema = z.object({
  value: z.number().min(0).max(100),
  submittedAt: z.string(),
});

/** Legacy flat question schema — prefer quizQuestionUnionSchema for new code. */
export const quizQuestionSchema = quizQuestionUnionSchema;

export const practiceQuizSessionDataSchema = z.object({
  confidenceSlider: confidenceSliderSchema.optional(),
  config: quizConfigSchema.optional(),
  quizConfig: quizConfigSchema.optional(),
  prescription: z.object({
    prescriptionType: z.string().optional(),
    primaryMode: z.string().nullable().optional(),
    summary: z.string().optional(),
    compositionPlan: z.record(z.unknown()).optional(),
  }).optional(),
  compositionPlan: z.record(z.unknown()).optional(),
  questions: z.array(quizQuestionUnionSchema),
  answers: z.array(z.object({
    questionId: z.string(),
    response: quizAnswerResponseSchema,
    correct: z.boolean(),
    timeSec: z.number().optional(),
    conceptId: z.string().optional(),
    skipped: z.boolean().optional(),
  })),
  interventions: z.array(z.object({
    conceptId: z.string(),
    shown: z.boolean(),
    accepted: z.boolean(),
  })).optional(),
}).passthrough();

export const flashcardSessionDataSchema = z.object({
  mode: z.enum(['due', 'browse']),
  flashcardMode: z.string().optional(),
  mixedPhrasing: z.boolean().optional(),
  prescription: sessionPrescriptionSchema.optional(),
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
  prescription: sessionPrescriptionSchema.optional(),
  completedSectionIds: z.array(z.string()),
  checkInResults: z.array(z.object({
    sectionId: z.string(),
    correct: z.boolean().optional(),
    response: z.string().optional(),
  })).optional(),
});

export const feynmanSessionDataSchema = z.object({
  prescription: sessionPrescriptionSchema.optional(),
  discussedConceptIds: z.array(z.string()),
  overallScore: z.number().optional(),
  conceptThreads: z.record(z.object({
    messages: z.array(z.object({
      id: z.string(),
      role: z.enum(['ai', 'user']),
      text: z.string().optional(),
      type: z.string().optional(),
      readyToComplete: z.boolean().optional(),
    })),
    aiTurnCount: z.number(),
    summary: z.object({
      confidencePercent: z.number(),
      thoroughness: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      suggestedNextSteps: z.array(z.string()),
    }).nullable().optional(),
  })),
});

export const freeRecallSessionDataSchema = z.object({
  prescription: sessionPrescriptionSchema.optional(),
  recallPrompt: z.string(),
  rawStudentResponse: z.string(),
  wasVoiceInput: z.boolean(),
  durationSec: z.number().optional(),
  characterCount: z.number().optional(),
  hintsUsed: z.number(),
  hints: z.array(z.object({ tier: z.number(), text: z.string() })).optional(),
  coveragePercent: z.number(),
  coverageEstimate: z.string().optional(),
  missedIdeas: z.array(z.string()).optional(),
  conceptsMissed: z.array(z.string()).optional(),
  incorrectIdeas: z.array(z.string()).optional(),
  hintsUsedNote: z.string().optional(),
  aiGradingSummary: z.string().optional(),
  nextConceptRecommendation: z.string().optional(),
});

export const interleavedSessionDataSchema = z.object({
  confidenceSlider: confidenceSliderSchema.optional(),
  prescription: sessionPrescriptionSchema.optional(),
  quizConfig: quizConfigSchema.optional(),
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
  challengeConfig: z.object({
    questionCount: z.number(),
    focusWeight: z.number(),
    strictSecondsPerQuestion: z.number(),
    strictMode: z.boolean().optional(),
    moduleDistributionPreview: z.array(z.object({
      moduleId: z.string(),
      name: z.string(),
      count: z.number(),
    })).optional(),
  }).optional(),
  flaggedIndices: z.array(z.number()).optional(),
  perModuleMissedConcept: z.record(z.string()).optional(),
  planReweighted: z.boolean().optional(),
  overallReadinessSignal: z.enum(['examReady', 'nearlyReady', 'notReady']).optional(),
  recommendedStudyPlan: z.string().optional(),
  totalTimeSec: z.number().optional(),
  timeRemainingSec: z.number().optional(),
});

export const cramSessionDataSchema = z.object({
  confidenceSlider: confidenceSliderSchema.optional(),
  cramConfig: z.object({
    durationMin: z.number(),
    selectedModuleIds: z.array(z.string()),
  }).optional(),
  questions: z.array(quizQuestionSchema).optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
    timeSec: z.number().optional(),
    conceptId: z.string().optional(),
  })).optional(),
  hardestConceptTag: z.string().optional(),
  perModuleAccuracy: z.record(z.number()).optional(),
  itemsCompleted: z.number().optional(),
  weakConcepts: z.array(z.string()).optional(),
  totalTimeSec: z.number().optional(),
});

export const diagnosticSessionDataSchema = z.object({
  confidenceSlider: confidenceSliderSchema.optional(),
  diagnostic: z.boolean().optional(),
  questions: z.array(quizQuestionSchema).optional(),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
  })).optional(),
  quizConfig: z.record(z.unknown()).optional(),
  placement: z.record(z.unknown()).optional(),
});

export const baselineCheckSessionDataSchema = z.object({
  confidenceSlider: confidenceSliderSchema.optional(),
  questions: z.array(quizQuestionSchema),
  answers: z.array(z.object({
    questionId: z.string(),
    response: z.union([z.string(), z.array(z.string())]),
    correct: z.boolean(),
  })).optional(),
  baselineResults: z.array(z.object({
    questionId: z.string(),
    wasCorrect: z.boolean(),
    difficultyEstimate: z.string(),
  })).optional(),
});
