import { journeyProposalSchema } from '@/utils/schemas/ai';
import { trimMaterial } from '@/api/ai/tokenEstimate';
import { invokeGemini, parseGeminiResponse } from '@/api/ai/client';

/**
 * @param {{ title: string, subject: string, priorKnowledge: string, material: string }} input
 */
export async function proposeJourney(input, options = {}) {
  const material = trimMaterial(input.material);
  if (!material || material.length < 50) {
    throw new Error('Please provide at least 50 characters of study material.');
  }

  const raw = await invokeGemini('proposeJourney', {
    title: input.title,
    subject: input.subject,
    priorKnowledge: input.priorKnowledge ?? 'some',
    material,
  }, options);

  const parsed = parseGeminiResponse(raw);
  const data = journeyProposalSchema.parse(parsed.data ?? parsed);

  if (import.meta.env.DEV && parsed.usage) {
    console.info('[AI] proposeJourney tokens:', parsed.usage);
  }

  return data;
}
