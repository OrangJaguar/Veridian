import { createJourney, deleteJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import {
  scaffoldJourneyActivities,
  createFlashcardDeck,
} from '@/api/entities/journeyScaffold';
import {
  generateJourneyId,
  generateModuleId,
} from '@/utils/schemas/ids';
import { createJourneySchema } from '@/utils/schemas/journey';
import { endOfTodayMs, startOfTomorrowMs } from '@/utils/dueToday/endOfToday';

const SAMPLE_MODULES = [
  { name: 'Stoichiometry', description: 'Mole ratios and limiting reagents', stage: 'B', masteryScore: 65 },
  { name: 'Thermodynamics', description: 'Enthalpy, entropy, and Gibbs free energy', stage: 'A', masteryScore: 0 },
  { name: 'Equilibrium', description: 'Le Chatelier and equilibrium constants', stage: 'B', masteryScore: 55 },
  { name: 'Electrochemistry', description: 'Redox reactions and cell potentials', stage: 'A', masteryScore: 0 },
];

const FLASHCARD_FRONTS = [
  'What is the rate law?',
  'Define activation energy',
  "Le Chatelier's principle states",
  'Kc expression for aA + bB ⇌ cC',
  'How does temperature affect K?',
  'Define standard cell potential',
  'Oxidation vs reduction',
  'Nernst equation purpose',
  'Faraday constant value',
  'Electrolysis vs galvanic cell',
];

const CAUGHT_UP_MODULES = [
  { name: 'Stoichiometry', description: 'Mole ratios and limiting reagents', stage: 'B', masteryScore: 75 },
  { name: 'Equilibrium', description: 'Le Chatelier and equilibrium constants', stage: 'B', masteryScore: 80 },
  { name: 'Thermodynamics', description: 'Enthalpy and Gibbs free energy', stage: 'B', masteryScore: 72 },
  { name: 'Electrochemistry', description: 'Redox and cell potentials', stage: 'B', masteryScore: 78 },
];

const WEAK_MODULES = [
  { name: 'Stoichiometry', description: 'Mole ratios and limiting reagents', stage: 'B', masteryScore: 25 },
  { name: 'Equilibrium', description: 'Le Chatelier and equilibrium constants', stage: 'B', masteryScore: 30 },
  { name: 'Thermodynamics', description: 'Enthalpy and Gibbs free energy', stage: 'B', masteryScore: 20 },
  { name: 'Electrochemistry', description: 'Redox and cell potentials', stage: 'B', masteryScore: 15 },
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
        masteryScore: mod.masteryScore ?? 0,
      })),
    );

    const activities = await scaffoldJourneyActivities(journeyId, modules);
    return { journey, modules, activities };
  } catch (err) {
    await deleteJourney(journeyId).catch(() => {});
    throw err;
  }
}

async function seedJourneyWithDueCards({ subject, title, examDate, dueMs, cardCount = 10 }) {
  const { journey, modules } = await createJourneyWithModules(
    { subject, title, examDate, priorKnowledge: 'some' },
    [
      {
        name: 'Equilibrium',
        description: 'Le Chatelier and equilibrium constants',
        stage: 'B',
        masteryScore: 55,
      },
      {
        name: 'Electrochemistry',
        description: 'Redox and cell potentials',
        stage: 'B',
        masteryScore: 45,
      },
    ],
  );

  const reviewModule = modules[0];
  const fsrsState = {
    due: dueMs,
    stability: 1,
    difficulty: 5,
    reps: 0,
    lapses: 0,
    state: 0,
    lastReview: null,
  };

  const { activity, cards } = await createFlashcardDeck(
    reviewModule.moduleId,
    journey.journeyId,
    {
      title: 'Equilibrium Review Deck',
      cards: Array.from({ length: cardCount }, (_, i) => ({
        front: FLASHCARD_FRONTS[i % FLASHCARD_FRONTS.length],
        back: 'Review answer from your notes.',
        fsrsState,
      })),
    },
  );

  return { journey, modules, activity, cards };
}

export async function seedSampleJourney() {
  const examDate = Date.now() + 14 * 24 * 60 * 60 * 1000;
  return createJourneyWithModules(
    {
      subject: 'AP Chemistry',
      title: 'Unit 4 — Chemical Reactions',
      examDate,
      priorKnowledge: 'some',
    },
    SAMPLE_MODULES,
  );
}

export async function seedDueTodayDemo() {
  const examDate = Date.now() + 6 * 24 * 60 * 60 * 1000;
  return seedJourneyWithDueCards({
    subject: 'AP Chemistry',
    title: 'Unit 4 — Due Today Demo',
    examDate,
    dueMs: endOfTodayMs(),
    cardCount: 10,
  });
}

export async function seedFutureDueJourney() {
  const examDate = Date.now() + 10 * 24 * 60 * 60 * 1000;
  return seedJourneyWithDueCards({
    subject: 'Cell Biology',
    title: 'Mitosis — Due Tomorrow',
    examDate,
    dueMs: startOfTomorrowMs() + 12 * 60 * 60 * 1000,
    cardCount: 8,
  });
}

export async function seedWeakModuleJourney() {
  const examDate = Date.now() + 5 * 24 * 60 * 60 * 1000;
  return createJourneyWithModules(
    {
      subject: 'AP Chemistry',
      title: 'Unit 5 — Weak Modules Demo',
      examDate,
      priorKnowledge: 'some',
    },
    WEAK_MODULES,
  );
}

export { SAMPLE_MODULES, CAUGHT_UP_MODULES };
