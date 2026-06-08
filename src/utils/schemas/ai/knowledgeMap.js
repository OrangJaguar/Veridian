import { z } from 'zod';

export const conceptSchema = z.object({
  id: z.string().min(1).max(32),
  term: z.string().min(1).max(80),
  definition: z.string().min(1).max(80),
});

export const moduleKnowledgeMapSchema = z.object({
  concepts: z.array(conceptSchema).max(10),
});

export const journeyProposalSchema = z.object({
  journeySummary: z.string().min(1).max(200),
  modules: z.array(
    z.object({
      name: z.string().min(1).max(80),
      description: z.string().min(1).max(120),
      concepts: z.array(conceptSchema).min(1).max(10),
    }),
  ).min(2).max(8),
});

export const cachedKnowledgeMapSchema = z.object({
  journeySummary: z.string().max(200),
  allConcepts: z.array(
    conceptSchema.extend({
      sourceModuleHint: z.string().max(80).optional(),
    }),
  ).min(2).max(80),
});
