import { createJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';

/**
 * Persist a confirmed journey proposal to Base44.
 * @param {{
 *   title: string,
 *   subject: string,
 *   examDate: number | null,
 *   priorKnowledge: string,
 *   proposal: { journeySummary: string, modules: { name: string, description: string, concepts: object[] }[] }
 * }} input
 */
export async function confirmJourney(input) {
  const journeyId = generateJourneyId();
  const now = Date.now();

  const journey = await createJourney({
    journeyId,
    subject: input.subject,
    title: input.title,
    examDate: input.examDate ?? null,
    priorKnowledge: input.priorKnowledge ?? 'some',
    knowledgeMap: {
      summary: input.proposal.journeySummary,
      extractedAt: now,
      moduleCount: input.proposal.modules.length,
    },
    createdAt: now,
    updatedAt: now,
  });

  const modules = await createModules(
    journeyId,
    input.proposal.modules.map((mod, index) => ({
      moduleId: generateModuleId(),
      name: mod.name,
      description: mod.description,
      order: index,
      stage: 'A',
      masteryScore: 0,
      knowledgeMap: { concepts: mod.concepts },
    })),
  );

  const activities = await scaffoldJourneyActivities(journeyId, modules);

  return { journey, modules, activities };
}
