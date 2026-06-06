import { createJourney, deleteJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';
import { createJourneySchema } from '@/utils/schemas/journey';

const SAMPLE_MODULES = [
  { name: 'Stoichiometry', description: 'Mole ratios and limiting reagents', stage: 'B' },
  { name: 'Thermodynamics', description: 'Enthalpy, entropy, and Gibbs free energy', stage: 'A' },
  { name: 'Equilibrium', description: 'Le Chatelier and equilibrium constants', stage: 'B' },
  { name: 'Electrochemistry', description: 'Redox reactions and cell potentials', stage: 'A' },
];

export async function createJourneyWithModules(journeyInput, moduleInputs = []) {
  const parsed = createJourneySchema.parse(journeyInput);
  const journeyId = generateJourneyId();

  const journey = await createJourney({
    journeyId,
    subject: parsed.subject,
    title: parsed.title,
    examDate: parsed.examDate ?? null,
    priorKnowledge: parsed.priorKnowledge ?? 'some',
  });

  const modulesToCreate = moduleInputs.length > 0 ? moduleInputs : SAMPLE_MODULES;

  try {
    const modules = await createModules(
      journeyId,
      modulesToCreate.map((mod, index) => ({
        moduleId: generateModuleId(),
        name: mod.name,
        description: mod.description ?? '',
        order: mod.order ?? index,
        stage: mod.stage ?? 'A',
      })),
    );
    return { journey, modules };
  } catch (err) {
    await deleteJourney(journeyId).catch(() => {});
    throw err;
  }
}

export async function seedSampleJourney() {
  const examDate = Date.now() + 14 * 24 * 60 * 60 * 1000;
  return createJourneyWithModules({
    subject: 'AP Chemistry',
    title: 'Unit 4 — Chemical Reactions',
    examDate,
    priorKnowledge: 'some',
  });
}

export { SAMPLE_MODULES };
