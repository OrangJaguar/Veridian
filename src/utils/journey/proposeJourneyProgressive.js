import { journeyProposalSchema } from '@/utils/schemas/ai';
import { normalizeJourneyProposal } from '@/utils/schemas/ai/normalize';
import { trimMaterial } from '@/api/ai/tokenEstimate';
import { invokeGemini, parseGeminiResponse } from '@/api/ai/client';
import { sanitizeMaterialInput, sanitizeShortLabel } from '@/utils/ai/sanitizeUserInput';
import { runChunkedGeneration } from '@/utils/ai/chunkedGeneration';

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

/**
 * Progressive journey propose: outline first, then concepts per module.
 */
export async function proposeJourneyProgressive(input, {
  onProgress,
  partialProposal = null,
  signal,
} = {}) {
  const base = buildBasePayload(input);
  let journeySummary = partialProposal?.journeySummary ?? '';
  let outlineModules = partialProposal?.modules?.map((m) => ({
    name: m.name,
    description: m.description,
  })) ?? [];

  const startModuleIndex = partialProposal?.modules?.filter((m) => m.concepts?.length)?.length ?? 0;

  if (!outlineModules.length) {
    onProgress?.({ phase: 'outline', moduleIndex: 0, moduleCount: 0 });
    const outlineRaw = await invokeGemini('proposeJourneyOutline', base, { signal });
    const outline = parseGeminiResponse(outlineRaw).data ?? parseGeminiResponse(outlineRaw);
    journeySummary = outline.journeySummary;
    outlineModules = outline.modules ?? [];
    if (outlineModules.length < 2) {
      throw new Error('AI returned too few modules. Try again with more material.');
    }
  }

  const completedModules = (partialProposal?.modules ?? []).slice(0, startModuleIndex);
  const modules = [...completedModules];

  await runChunkedGeneration({
    totalChunks: outlineModules.length,
    existingResults: Array.from({ length: startModuleIndex }, () => null),
    startIndex: startModuleIndex,
    tracePrefix: 'journey_module',
    runChunk: async (index, _prior, chunkSignal) => {
      const mod = outlineModules[index];
      onProgress?.({ phase: 'concepts', moduleIndex: index + 1, moduleCount: outlineModules.length });
      const raw = await invokeGemini('proposeModuleConcepts', {
        ...base,
        journeySummary,
        module: { name: mod.name, description: mod.description },
        moduleIndex: index,
        moduleCount: outlineModules.length,
      }, { signal: chunkSignal ?? signal });

      const parsed = parseGeminiResponse(raw);
      const concepts = parsed.data?.concepts ?? parsed.concepts ?? [];
      if (!concepts.length) {
        throw new Error(`AI returned no concepts for module "${mod.name}".`);
      }
      return { ...mod, concepts };
    },
    mapResult: (mod) => mod,
    onChunkComplete: (mod, index, total) => {
      modules[index] = mod;
      onProgress?.({
        phase: 'concepts',
        moduleIndex: index + 1,
        moduleCount: total,
        partialProposal: { journeySummary, modules: [...modules] },
      });
    },
  });

  const proposal = journeyProposalSchema.parse(
    normalizeJourneyProposal({ journeySummary, modules }),
  );
  return proposal;
}

/**
 * @param {{ title: string, subject: string, priorKnowledge: string, material: string }} input
 */
export async function proposeJourney(input, options = {}) {
  if (options.progressive === false) {
    const base = buildBasePayload(input);
    const raw = await invokeGemini('proposeJourney', base, options);
    const parsed = parseGeminiResponse(raw);
    const data = journeyProposalSchema.parse(
      normalizeJourneyProposal(parsed.data ?? parsed),
    );
    if (import.meta.env.DEV && parsed.usage) {
      console.info('[AI] proposeJourney tokens:', parsed.usage);
    }
    return data;
  }

  return proposeJourneyProgressive(input, {
    onProgress: options.onProgress,
    partialProposal: options.partialProposal,
    signal: options.signal,
  });
}
