import { journeyProposalSchema, cachedKnowledgeMapSchema } from '@/utils/schemas/ai';
import { normalizeJourneyProposal } from '@/utils/schemas/ai/normalize';
import { invokeAiJourney, parseAiJourneyResponse } from '@/api/ai/client';

/**
 * @param {{ title: string, subject: string, priorKnowledge: string, cachedKnowledgeMap: object }} input
 */
export async function regenerateModules(input, options = {}) {
  const cached = cachedKnowledgeMapSchema.parse(input.cachedKnowledgeMap);

  const raw = await invokeAiJourney('regenerateModules', {
    title: input.title,
    subject: input.subject,
    priorKnowledge: input.priorKnowledge ?? 'some',
    cachedKnowledgeMap: cached,
  }, options);

  const parsed = parseAiJourneyResponse(raw);
  const data = journeyProposalSchema.parse(
    normalizeJourneyProposal(parsed.data ?? parsed),
  );

  if (import.meta.env.DEV && parsed.usage) {
    console.info('[AI] regenerateModules tokens:', parsed.usage);
  }

  return data;
}

export function buildCachedKnowledgeMap(proposal) {
  const allConcepts = [];
  for (const mod of proposal.modules) {
    for (const c of mod.concepts) {
      allConcepts.push({
        ...c,
        sourceModuleHint: mod.name,
      });
    }
  }
  return {
    journeySummary: proposal.journeySummary,
    allConcepts,
  };
}