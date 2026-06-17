import { requireAuth } from '@/api/requireAuth';
import { createJourney, updateJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';
import { base44 } from '@/api/base44Client';
import { isVeridianCertifiedJourney } from '@/lib/veridianCertified';

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
    diagnosticSkipped: false,
    createdAt: now,
    updatedAt: now,
  });

  const modules = await createModules(
    newJourneyId,
    sorted.map((mod, index) => ({
      moduleId: generateModuleId(),
      name: mod.name,
      description: mod.description ?? '',
      order: index,
      stage: 'A',
      masteryScore: 0,
      knowledgeMap: mod.knowledgeMap ?? { concepts: [] },
      libraryVisible: false,
    })),
  );

  await scaffoldJourneyActivities(newJourneyId, modules);

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
