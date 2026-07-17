import { z } from 'zod';

export const conceptSchema = z.object({
  id: z.string().min(1).max(32),
  term: z.string().min(1).max(80),
  definition: z.string().min(1).max(80),
});

export const conceptRelationTypeSchema = z.enum(['prerequisite', 'related']);

export const conceptRelationSchema = z.object({
  fromConceptId: z.string().min(1).max(32),
  toConceptId: z.string().min(1).max(32),
  type: conceptRelationTypeSchema,
});

export const moduleKnowledgeMapSchema = z.object({
  concepts: z.array(conceptSchema).max(10),
  relations: z.array(conceptRelationSchema).max(40).optional(),
});

export const journeyProposalSchema = z.object({
  journeySummary: z.string().min(1).max(200),
  modules: z.array(
    z.object({
      name: z.string().min(1).max(80),
      description: z.string().min(1).max(120),
      concepts: z.array(conceptSchema).min(1).max(10),
      relations: z.array(conceptRelationSchema).max(40).optional(),
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
  relations: z.array(conceptRelationSchema).max(120).optional(),
});

/**
 * Drop dangling edges and self-loops; keep only known concept IDs.
 */
export function normalizeConceptRelations(relations = [], concepts = []) {
  const ids = new Set((concepts ?? []).map((c) => c.id).filter(Boolean));
  const seen = new Set();
  const out = [];
  for (const rel of relations ?? []) {
    if (!rel?.fromConceptId || !rel?.toConceptId) continue;
    if (rel.fromConceptId === rel.toConceptId) continue;
    if (!ids.has(rel.fromConceptId) || !ids.has(rel.toConceptId)) continue;
    const type = rel.type === 'prerequisite' ? 'prerequisite' : 'related';
    const key = `${rel.fromConceptId}|${rel.toConceptId}|${type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      fromConceptId: rel.fromConceptId,
      toConceptId: rel.toConceptId,
      type,
    });
  }
  return out;
}
