import { requireAuth } from '@/api/requireAuth';
import { createJourney, updateJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { createActivity } from '@/api/entities/activities';
import { createCards } from '@/api/entities/cards';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import {
  generateJourneyId,
  generateModuleId,
  generateActivityId,
  generateCardId,
} from '@/utils/schemas/ids';
import { base44 } from '@/api/base44Client';
import { isVeridianCertifiedJourney } from '@/lib/veridianCertified';

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

async function copyCertifiedActivities({
  sourceJourneyId,
  newJourneyId,
  moduleIdMap,
  selectedModuleIds,
}) {
  const sourceActivities = await base44.entities.Activity.filter({ journeyId: sourceJourneyId });
  const selectedSet = new Set(selectedModuleIds);
  const relevant = sourceActivities.filter(
    (act) => !act.moduleId || selectedSet.has(act.moduleId),
  );

  const activityIdMap = new Map();

  for (const source of relevant) {
    const newActivityId = generateActivityId();
    activityIdMap.set(source.activityId, newActivityId);

    await createActivity(newJourneyId, {
      activityId: newActivityId,
      moduleId: source.moduleId ? moduleIdMap.get(source.moduleId) ?? null : null,
      scope: source.scope,
      type: source.type,
      status: source.status,
      title: source.title,
      description: source.description ?? '',
      content: deepCopy(source.content),
      stats: deepCopy(source.stats),
      itemCount: source.itemCount ?? 0,
      libraryVisible: false,
    });
  }

  for (const source of relevant) {
    if (source.type !== 'flashcardSet') continue;
    const newActivityId = activityIdMap.get(source.activityId);
    if (!newActivityId) continue;

    const sourceCards = await base44.entities.Card.filter({ activityId: source.activityId });
    if (!sourceCards.length) continue;

    await createCards(
      newActivityId,
      newJourneyId,
      sourceCards.map((card) => ({
        cardId: generateCardId(),
        front: card.front,
        back: card.back,
        conceptTag: card.conceptTag,
        fsrsState: deepCopy(card.fsrsState),
        suspended: card.suspended ?? false,
      })),
    );
  }

  return activityIdMap;
}

/**
 * Clone a public journey into the current user's account.
 */
export async function cloneJourney(sourceJourneyId, {
  title,
  examDate,
  moduleIds,
} = {}) {
  const user = await requireAuth();

  const sourceRows = await base44.entities.Journey.filter({ journeyId: sourceJourneyId });
  const source = sourceRows[0];
  if (!source?.isPublic) {
    throw new Error('This journey is not available to clone');
  }

  const sourceModules = await base44.entities.Module.filter({ journeyId: sourceJourneyId });
  const selectedModules = moduleIds?.length
    ? sourceModules.filter((m) => moduleIds.includes(m.moduleId))
    : sourceModules;

  if (selectedModules.length === 0) {
    throw new Error('Select at least one module to clone');
  }

  const sorted = selectedModules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const newJourneyId = generateJourneyId();
  const now = Date.now();
  const certified = isVeridianCertifiedJourney(source);
  const defaultTitle = certified
    ? `Based on Veridian's ${source.title}`
    : `${source.title} (copy)`;

  const journey = await createJourney({
    journeyId: newJourneyId,
    subject: source.subject,
    title: title?.trim() || defaultTitle,
    examDate: examDate ?? null,
    priorKnowledge: source.priorKnowledge ?? 'some',
    knowledgeMap: source.knowledgeMap ?? {},
    tags: [...(source.tags ?? [])],
    isPublic: false,
    clonedFromJourneyId: sourceJourneyId,
    clonedFromTitle: source.title,
    clonedFromVeridianCertified: certified,
    createdAt: now,
    updatedAt: now,
  });

  const moduleIdMap = new Map();
  const modulePayloads = sorted.map((mod, index) => {
    const newModuleId = generateModuleId();
    moduleIdMap.set(mod.moduleId, newModuleId);
    return {
      moduleId: newModuleId,
      name: mod.name,
      description: mod.description ?? '',
      order: index,
      stage: certified ? (mod.stage ?? 'A') : 'A',
      masteryScore: certified ? (mod.masteryScore ?? 0) : 0,
      knowledgeMap: deepCopy(mod.knowledgeMap) ?? { concepts: [] },
      moduleStatus: mod.moduleStatus,
      estimatedStudyMinutes: mod.estimatedStudyMinutes,
      libraryVisible: false,
    };
  });

  const modules = await createModules(newJourneyId, modulePayloads);

  if (certified) {
    await copyCertifiedActivities({
      sourceJourneyId,
      newJourneyId,
      moduleIdMap,
      selectedModuleIds: sorted.map((m) => m.moduleId),
    });
  } else {
    await scaffoldJourneyActivities(newJourneyId, modules);
  }

  await updateJourney(sourceJourneyId, {
    cloneCount: (source.cloneCount ?? 0) + 1,
  });

  return { journey, modules, journeyId: newJourneyId };
}

/**
 * Load source modules for clone modal (public journey).
 */
export async function getCloneSourceModules(journeyId) {
  const journeys = await base44.entities.Journey.filter({ journeyId });
  if (!journeys[0]?.isPublic) throw new Error('Journey not public');
  const modules = await base44.entities.Module.filter({ journeyId });
  return modules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
