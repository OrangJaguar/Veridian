import { journeyProposalSchema } from '@/utils/schemas/ai';
import { normalizeJourneyProposal } from '@/utils/schemas/ai/normalize';
import { trimMaterial } from '@/api/ai/tokenEstimate';
import { invokeGemini, parseGeminiResponse } from '@/api/ai/client';
import { sanitizeMaterialInput, sanitizeShortLabel } from '@/utils/ai/sanitizeUserInput';

function buildBasePayload(input) {
  const material = trimMaterial(sanitizeMaterialInput(input.material));
  if (!material || material.length < 50) {
    throw new Error('Please provide at least 50 characters of study material.');
  }
  return {
    title: sanitizeShortLabel(input.title, 120),
    subject: sanitizeShortLabel(input.subject, 80),
    priorKnowledge: input.priorKnowledge ?? 'some',
    material,
  };
}

function parseProposal(raw) {
  const parsed = parseGeminiResponse(raw);
  return journeyProposalSchema.parse(
    normalizeJourneyProposal(parsed.data ?? parsed),
  );
}

/**
 * Journey propose — max 2 AI calls total:
 *   1. proposeJourney (one-shot, full material)
 *   2. repairJourneyProposal (only if call 1 fails validation)
 */
export async function proposeJourney(input, options = {}) {
  const base = buildBasePayload(input);
  const { onProgress, signal } = options;

  onProgress?.({ phase: 'propose', moduleIndex: 0, moduleCount: 0 });

  const raw = await invokeGemini('proposeJourney', base, { signal });

  let firstError;
  try {
    const proposal = parseProposal(raw);
    if (proposal.modules.length < 2) {
      throw new Error('AI returned too few modules.');
    }
    return proposal;
  } catch (err) {
    firstError = err;
  }

  // Call 2 of 2: ask the model to repair its own output. Never more than this.
  onProgress?.({ phase: 'repair', moduleIndex: 0, moduleCount: 0 });

  const parsedFirst = (() => {
    try {
      const p = parseGeminiResponse(raw);
      return p.data ?? p;
    } catch {
      return {};
    }
  })();

  const repairRaw = await invokeGemini('repairJourneyProposal', {
    ...base,
    partialProposal: typeof parsedFirst === 'object' && parsedFirst !== null ? parsedFirst : {},
    validationErrors: String(firstError?.message ?? 'Proposal failed validation').slice(0, 2000),
  }, { signal });

  const repaired = parseProposal(repairRaw);
  if (repaired.modules.length < 2) {
    throw new Error('AI returned too few modules. Try again with more material.');
  }
  return repaired;
}

/** @deprecated Use proposeJourney — kept for import compatibility. */
export const proposeJourneyProgressive = proposeJourney;
