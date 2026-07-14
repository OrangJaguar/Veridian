import { createJourney, getJourney, updateJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import { publishJourney } from '@/api/entities/library';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';
import { scanJourneyForModeration } from '@/utils/library/contentModeration';
import { rebuildGlobalPlan } from '@/api/entities/globalPlan';

/**
 * Persist a confirmed journey proposal to Base44.
 * @param {{
 *   title: string,
 *   subject: string,
 *   examDate: number | null,
 *   priorKnowledge: string,
 *   isPublic?: boolean,
 *   tags?: string[],
 *   proposal: { journeySummary: string, modules: { name: string, description: string, concepts: object[] }[] }
 * }} input
 */
export async function confirmJourney(input) {
  const journeyId = generateJourneyId();
  const now = Date.now();
  const wantPublic = !!input.isPublic;

  const journey = await createJourney({
    journeyId,
    subject: input.subject,
    title: input.title,
    examDate: input.examDate ?? null,
    priorKnowledge: input.priorKnowledge ?? 'some',
    isPublic: false,
    tags: input.tags ?? [],
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

  try {
    await rebuildGlobalPlan({ force: true });
  } catch {
    /* plan will rebuild on next ensure */
  }

  let publishBlocked = false;
  let publishBlockReason = null;

  if (wantPublic && (input.tags ?? []).length > 0) {
    const moderation = scanJourneyForModeration({
      journey: { ...journey, title: input.title, subject: input.subject, priorKnowledge: input.priorKnowledge },
      modules,
      tags: input.tags,
    });

    if (!moderation.allowed) {
      publishBlocked = true;
      publishBlockReason = moderation.summary;
      await updateJourney(journeyId, {
        libraryPublishBlocked: true,
        libraryPublishBlockReason: moderation.summary,
      });
    } else {
      try {
        await publishJourney(journeyId, { tags: input.tags });
      } catch (err) {
        publishBlocked = true;
        publishBlockReason = err.message || 'Could not publish to the community library.';
        await updateJourney(journeyId, {
          libraryPublishBlocked: true,
          libraryPublishBlockReason: publishBlockReason,
        });
      }
    }
  }

  const finalJourney = await getJourney(journeyId);
  return {
    journey: finalJourney ?? journey,
    modules,
    activities,
    publishBlocked,
    publishBlockReason,
  };
}
