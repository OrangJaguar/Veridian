import { z } from 'zod';
import { FAILURE_MODE_IDS, FAILURE_EVIDENCE_VERSION } from '@/utils/failures/constants';

export const failureModeIdSchema = z.enum([
  'understanding_gap',
  'verbatim_trap',
  'transfer_failure',
  'interference',
  'pressure_collapse',
  'retention_decay',
]);

export const evidenceSampleSchema = z.object({
  sessionId: z.string(),
  activityType: z.string(),
  at: z.number(),
  note: z.string().optional(),
});

export const modeEvidenceSchema = z.object({
  hits: z.number().min(0),
  lastAt: z.number().optional(),
  samples: z.array(evidenceSampleSchema).optional(),
});

export const conceptEvidenceSchema = z.object({
  conceptId: z.string(),
  modes: z.record(failureModeIdSchema, modeEvidenceSchema).optional(),
});

export const moduleFailureEvidenceSchema = z.object({
  version: z.literal(FAILURE_EVIDENCE_VERSION),
  concepts: z.record(z.string(), conceptEvidenceSchema).optional(),
  moduleLevel: z.record(failureModeIdSchema, modeEvidenceSchema).optional(),
  processedSessionIds: z.array(z.string()).optional(),
  updatedAt: z.number().optional(),
});

export const confidenceLevelSchema = z.enum(['emerging', 'confirmed']);

export const rankedModeSchema = z.object({
  modeId: failureModeIdSchema,
  score: z.number(),
  confidence: confidenceLevelSchema,
  conceptCount: z.number(),
  rawHits: z.number(),
});

export const rankedConceptSchema = z.object({
  conceptId: z.string(),
  label: z.string(),
  modeId: failureModeIdSchema,
  hits: z.number(),
  confidence: confidenceLevelSchema,
});

export const trendSchema = z.enum(['improving', 'stable', 'worsening', 'unknown']);

export const failureProfileSchema = z.object({
  primaryMode: failureModeIdSchema.nullable(),
  secondaryMode: failureModeIdSchema.nullable(),
  rankedModes: z.array(rankedModeSchema),
  topConcepts: z.array(rankedConceptSchema),
  evidenceSessionCount: z.number(),
  lastUpdatedAt: z.number().nullable(),
  hasData: z.boolean(),
  trend: trendSchema.optional(),
  primaryConfidence: confidenceLevelSchema.nullable().optional(),
});

export function emptyModuleFailureEvidence(now = Date.now()) {
  return {
    version: FAILURE_EVIDENCE_VERSION,
    concepts: {},
    moduleLevel: {},
    processedSessionIds: [],
    updatedAt: now,
  };
}

export function parseModuleFailureEvidence(raw) {
  if (!raw) return emptyModuleFailureEvidence();
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const result = moduleFailureEvidenceSchema.safeParse(parsed);
    if (result.success) return result.data;
  } catch {
    /* fall through */
  }
  return emptyModuleFailureEvidence();
}

export { FAILURE_MODE_IDS };
