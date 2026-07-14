import { createActivity } from '@/api/entities/activities';
import { createCards } from '@/api/entities/cards';
import { generateActivityId, generateCardId } from '@/utils/schemas/ids';
import { staggerNewCardDueDates } from '@/utils/fsrs/dueTodaySchedule';

const MODULE_ACTIVITY_DEFS = [
  { type: 'learningGuide', status: 'notGenerated', title: 'Learning Guide' },
  { type: 'baselineCheck', status: 'ready', title: 'Starting Point Check' },
  { type: 'practiceQuiz', status: 'ready', title: 'Practice Quiz' },
  { type: 'feynman', status: 'ready', title: 'Feynman Technique' },
  { type: 'freeRecall', status: 'ready', title: 'Free Recall' },
];

const JOURNEY_ACTIVITY_DEFS = [
  { type: 'journeyChallenge', status: 'ready', title: 'Journey Challenge' },
  { type: 'cramSession', status: 'ready', title: 'Cram Session' },
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

  const dueDates = staggerNewCardDueDates(cards.length);

  const cardRecords = await createCards(
    activityId,
    journeyId,
    cards.map((card, i) => ({
      cardId: generateCardId(),
      front: card.front,
      back: card.back,
      fsrsState: card.fsrsState ?? {
        due: dueDates[i],
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
