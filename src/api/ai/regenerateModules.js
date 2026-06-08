import { journeyProposalSchema, cachedKnowledgeMapSchema } from '@/utils/schemas/ai';
import { invokeGemini, parseGeminiResponse } from '@/api/ai/client';

/**
 * @param {{ title: string, subject: string, priorKnowledge: string, cachedKnowledgeMap: object }} input
 */
export async function regenerateModules(input, options = {}) {
  const cached = cachedKnowledgeMapSchema.parse(input.cachedKnowledgeMap);

  const raw = await invokeGemini('regenerateModules', {
    title: input.title,
    subject: input.subject,
    priorKnowledge: input.priorKnowledge ?? 'some',
    cachedKnowledgeMap: cached,
  }, options);

  const parsed = parseGeminiResponse(raw);
  const data = journeyProposalSchema.parse(parsed.data ?? parsed);

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
