import { z } from 'zod';
import { isValidJourneyTitle, normalizeJourneyTitle } from '@/utils/schemas/journeyTitle';

export const priorKnowledgeSchema = z.enum(['scratch', 'some', 'most']);

export const journeySourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string().optional(),
  content: z.string().optional(),
  fileUrl: z.string().optional(),
  addedAt: z.number().optional(),
});

export const journeySchema = z.object({
  journeyId: z.string(),
  userEmail: z.string().optional(),
  subject: z.string(),
  title: z.string(),
  examDate: z.number().nullable().optional(),
  priorKnowledge: priorKnowledgeSchema.optional(),
  isPublic: z.boolean().optional(),
  archived: z.boolean().optional(),
  archivedManually: z.boolean().optional(),
  diagnosticSkipped: z.boolean().optional(),
  diagnosticSummary: z.string().optional(),
  sources: z.array(journeySourceSchema).optional(),
  knowledgeMap: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  showSources: z.boolean().optional(),
  cloneCount: z.number().optional(),
  ratingSum: z.number().optional(),
  ratingCount: z.number().optional(),
  lastStudiedAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  weeklyPlanSnapshot: z.record(z.unknown()).optional(),
  weeklyPlanWeekKey: z.string().optional(),
  weeklyPlanBuiltAt: z.number().optional(),
  weeklyPlanMode: z.enum(['normal', 'cram']).optional(),
  publishedAt: z.number().nullable().optional(),
  creatorUsername: z.string().optional(),
  clonedFromJourneyId: z.string().optional(),
  clonedFromTitle: z.string().optional(),
  clonedFromVeridianCertified: z.boolean().optional(),
  isVeridianCertified: z.boolean().optional(),
  libraryCategory: z.string().optional(),
  moduleFocusBoosts: z.record(z.number()).optional(),
  publishStatus: z.enum(['draft', 'published']).optional(),
  examType: z.enum(['AP', 'SAT', 'IB', 'general', 'custom']).optional(),
  difficultyLevel: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  targetAudience: z.string().optional(),
  estimatedStudyHours: z.number().optional(),
  coverColor: z.string().optional(),
  coverImageUrl: z.string().optional(),
  isAdminAuthored: z.boolean().optional(),
  generationStatus: z.enum(['processing', 'completed', 'failed']).optional(),
  generationError: z.string().nullable().optional(),
  sourceMode: z.enum(['upload', 'paste', 'topic']).optional(),
  sourceTopic: z.string().optional(),
});

export const createJourneySchema = journeySchema.pick({
  subject: true,
  title: true,
}).extend({
  title: z.string().transform(normalizeJourneyTitle).refine(
    isValidJourneyTitle,
    'Journey title must be 3–50 characters and use URL-friendly characters.',
  ),
  examDate: z.number().nullable().optional(),
  priorKnowledge: priorKnowledgeSchema.optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).max(8).optional(),
});

export const updateJourneySchema = journeySchema.partial().omit({ journeyId: true });
