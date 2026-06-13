import { createActivity } from '@/api/entities/activities';
import { createCards } from '@/api/entities/cards';
import { generateActivityId, generateCardId } from '@/utils/schemas/ids';

const MODULE_ACTIVITY_DEFS = [
  { type: 'learningGuide', status: 'notGenerated', title: 'Learning Guide' },
  { type: 'practiceQuiz', status: 'ready', title: 'Practice Quiz' },
  { type: 'feynman', status: 'ready', title: 'Feynman Technique' },
  { type: 'freeRecall', status: 'ready', title: 'Free Recall' },
];

const JOURNEY_ACTIVITY_DEFS = [
  { type: 'diagnostic', status: 'ready', title: 'Diagnostic Assessment' },
  { type: 'interleavedReview', status: 'ready', title: 'Interleaved Review' },
  { type: 'journeyChallenge', status: 'ready', title: 'Journey Challenge' },
];

/**
 * Creates the standard activity scaffold for a journey (no flashcard decks).
 * @param {string} journeyId
 * @param {{ moduleId: string, name: string }[]} modules
 */
export async function scaffoldJourneyActivities(journeyId, modules) {
  const created = [];

  for (const mod of modules) {
    for (const def of MODULE_ACTIVITY_DEFS) {
      const activity = await createActivity(journeyId, {
        activityId: generateActivityId(),
        moduleId: mod.moduleId,
        scope: 'module',
        type: def.type,
        status: def.status,
        title: def.title,
        description: `${def.title} for ${mod.name}`,
      });
      created.push(activity);
    }
  }

  for (const def of JOURNEY_ACTIVITY_DEFS) {
    const activity = await createActivity(journeyId, {
      activityId: generateActivityId(),
      moduleId: null,
      scope: 'journey',
      type: def.type,
      status: def.status,
      title: def.title,
      description: def.title,
    });
    created.push(activity);
  }

  return created;
}

/**
 * Student-initiated path to create a flashcard deck + cards.
 * @param {string} moduleId
 * @param {string} journeyId
 * @param {{ title: string, cards: { front: string, back: string, fsrsState?: object }[] }} options
 */
export async function createFlashcardDeck(moduleId, journeyId, { title, cards }) {
  const activityId = generateActivityId();

  const activity = await createActivity(journeyId, {
    activityId,
    moduleId,
    scope: 'module',
    type: 'flashcardSet',
    status: 'ready',
    title,
    description: `Flashcard deck: ${title}`,
    itemCount: cards.length,
    stats: { dueCount: cards.length },
  });

  const cardRecords = await createCards(
    activityId,
    journeyId,
    cards.map((card) => ({
      cardId: generateCardId(),
      front: card.front,
      back: card.back,
      fsrsState: card.fsrsState ?? {
        due: Date.now(),
        stability: 1,
        difficulty: 5,
        reps: 0,
        lapses: 0,
        state: 0,
        lastReview: null,
      },
    })),
  );

  return { activity, cards: cardRecords };
}
