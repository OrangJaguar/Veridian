import { proposeJourney } from '@/api/ai/proposeJourney';
import { createJourney, updateJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/api/query-keys';
import { buildTopicMaterial } from '@/utils/journey/topicMaterial';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';
import { normalizeConceptRelations } from '@/utils/schemas/ai/knowledgeMap';

function buildSourceEntries(draft) {
  const now = Date.now();
  const mode = draft.sourceMode ?? 'paste';

  if (mode === 'upload' && draft.uploadedFileNames?.length) {
    return draft.uploadedFileNames.map((name, i) => ({
      id: `file-${i}`, type: 'file', label: name, addedAt: now,
    }));
  }

  if (mode === 'link' && draft.sourceUrl?.trim()) {
    return [{
      id: 'link-0', type: 'url', label: draft.sourceUrl.trim(),
      content: draft.material?.slice(0, 200), addedAt: now,
    }];
  }

  if (mode === 'image' && draft.uploadedFileNames?.length) {
    return [{
      id: 'image-0', type: 'image',
      label: `${draft.uploadedFileNames.length} image${draft.uploadedFileNames.length > 1 ? 's' : ''}`,
      addedAt: now,
    }];
  }

  if (mode === 'paste') {
    return [{ id: 'paste-0', type: 'paste', label: 'Pasted text', addedAt: now }];
  }

  if (mode === 'topic') {
    return [{ id: 'topic-0', type: 'topic', label: draft.material?.trim()?.slice(0, 80), addedAt: now }];
  }

  return [];
}

async function persistProposal(journeyId, draft, proposal) {
  const now = Date.now();
  await updateJourney(journeyId, {
    knowledgeMap: {
      summary: proposal.journeySummary,
      extractedAt: now,
      moduleCount: proposal.modules.length,
    },
    title: draft.title.trim() || journeyId,
    subject: draft.subject.trim() || 'General',
    examDate: draft.examDate ?? null,
    priorKnowledge: draft.priorKnowledge ?? 'some',
    tags: draft.tags ?? [],
  });

  const modules = await createModules(
    journeyId,
    proposal.modules.map((mod, index) => ({
      moduleId: generateModuleId(),
      name: mod.name,
      description: mod.description,
      order: index,
      stage: 'A',
      masteryScore: 0,
      knowledgeMap: {
        concepts: mod.concepts,
        relations: normalizeConceptRelations(mod.relations, mod.concepts),
      },
    })),
  );

  await scaffoldJourneyActivities(journeyId, modules);
}

async function runGeneration(journeyId, draft) {
  const title = draft.title.trim() || draft.material.trim().slice(0, 80) || 'My Journey';
  const subject = draft.subject.trim() || 'General';
  const material = draft.sourceMode === 'topic'
    ? buildTopicMaterial(draft.material, title, subject)
    : draft.material;

  const proposal = await proposeJourney({
    title,
    subject,
    priorKnowledge: draft.priorKnowledge ?? 'some',
    material,
  });

  await persistProposal(journeyId, { ...draft, title, subject }, proposal);
  try {
    await rebuildGlobalPlan({ force: true });
  } catch {
    /* plan will rebuild on next ensure */
  }
  await updateJourney(journeyId, {
    generationStatus: 'completed',
    generationError: null,
  });
}

/**
 * Fire-and-forget journey generation. Returns immediately after creating stub.
 */
export async function startAsyncJourneyGeneration(draft) {
  const journeyId = generateJourneyId();
  const now = Date.now();
  const title = draft.title.trim() || (draft.sourceMode === 'topic' ? draft.material.trim() : 'My Journey');
  const subject = draft.subject.trim() || 'General';

  await createJourney({
    journeyId,
    title,
    subject,
    examDate: draft.examDate ?? null,
    priorKnowledge: draft.priorKnowledge ?? 'some',
    isPublic: false,
    tags: draft.tags ?? [],
    generationStatus: 'processing',
    generationError: null,
    sourceMode: draft.sourceMode ?? 'paste',
    sourceTopic: draft.sourceMode === 'topic' ? draft.material.trim() : undefined,
    sourceUrl: draft.sourceMode === 'link' ? draft.sourceUrl?.trim() : undefined,
    sources: buildSourceEntries(draft),
    knowledgeMap: { summary: 'Generating…', extractedAt: now, moduleCount: 0 },
  });

  queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });

  void runGeneration(journeyId, draft)
    .then(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dueToday });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalPlan });
    })
    .catch(async (err) => {
      await updateJourney(journeyId, {
        generationStatus: 'failed',
        generationError: err?.message || 'Generation failed',
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: queryKeys.journeys.all });
    });

  try {
    void import('@/api/base44Client').then(({ base44 }) => {
      base44.functions.invoke('generateJourneyAsync', { journeyId, draft }).catch(() => {});
    });
  } catch {
    // optional server hook
  }

  return { journeyId };
}
