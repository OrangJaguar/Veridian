import { createJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { listJourneys } from '@/api/entities/journeys';
import { listActivitiesByJourney, updateActivity } from '@/api/entities/activities';
import { scaffoldJourneyActivities, createFlashcardDeck } from '@/api/entities/journeyScaffold';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';
import { endOfTodayMs } from '@/utils/dueToday/endOfToday';
import {
  STARTER_JOURNEY_META,
  STARTER_MODULES,
  LEARNING_GUIDE_CONTENT,
  PRACTICE_QUIZ_QUESTIONS,
  FLASHCARD_DECK,
  INTERLEAVED_QUESTIONS,
  JOURNEY_CHALLENGE_QUESTIONS,
  SYNTHESIS_QUESTIONS,
} from '@/fixtures/starterJourney/aiJourneyContent';

let provisionLock = false;

/**
 * Create the starter AI journey for new (or empty) accounts.
 * Idempotent: skips if the user already has any active journey.
 */
export async function provisionStarterJourney() {
  if (provisionLock) return null;
  provisionLock = true;

  try {
    const existing = await listJourneys({ archived: false });
    if (existing.length > 0) return null;

    const journeyId = generateJourneyId();
    const examDate = Date.now() + STARTER_JOURNEY_META.examDateOffsetDays * 86400000;

    const journey = await createJourney({
      journeyId,
      subject: STARTER_JOURNEY_META.subject,
      title: STARTER_JOURNEY_META.title,
      examDate,
      priorKnowledge: STARTER_JOURNEY_META.priorKnowledge,
    });

    const modules = await createModules(
      journeyId,
      STARTER_MODULES.map((mod, index) => ({
        moduleId: generateModuleId(),
        name: mod.name,
        description: mod.description,
        order: index,
        stage: mod.stage,
        masteryScore: mod.masteryScore,
        knowledgeMap: mod.knowledgeMap,
      })),
    );

    await scaffoldJourneyActivities(journeyId, modules);

    const activities = await listActivitiesByJourney(journeyId);
    const modA = modules.find((m) => m.stage === 'A');
    const modB = modules.find((m) => m.stage === 'B');
    const modC = modules.find((m) => m.stage === 'C');

    const patchActivity = (moduleId, type, patch) => {
      const act = activities.find((a) => a.moduleId === moduleId && a.type === type);
      if (act) return updateActivity(act.activityId, patch);
      return null;
    };

    if (modA) {
      await patchActivity(modA.moduleId, 'learningGuide', {
        status: 'ready',
        content: LEARNING_GUIDE_CONTENT,
        itemCount: LEARNING_GUIDE_CONTENT.totalSections,
      });
    }

    if (modB) {
      await patchActivity(modB.moduleId, 'practiceQuiz', {
        status: 'ready',
        content: { questions: PRACTICE_QUIZ_QUESTIONS, recommendedFocus: 'fullReview' },
        itemCount: PRACTICE_QUIZ_QUESTIONS.length,
      });

      const dueMs = endOfTodayMs();
      await createFlashcardDeck(modB.moduleId, journeyId, {
        title: FLASHCARD_DECK.title,
        cards: FLASHCARD_DECK.cards.map((c) => ({
          ...c,
          fsrsState: {
            due: dueMs,
            stability: 1,
            difficulty: 5,
            reps: 0,
            lapses: 0,
            state: 0,
            lastReview: null,
          },
        })),
      });
    }

    if (modC) {
      await patchActivity(modC.moduleId, 'synthesis', {
        status: 'ready',
        content: { questions: SYNTHESIS_QUESTIONS },
        itemCount: SYNTHESIS_QUESTIONS.length,
      });
    }

    const interleaved = activities.find((a) => a.type === 'interleavedReview');
    if (interleaved) {
      await updateActivity(interleaved.activityId, {
        status: 'ready',
        content: { questions: INTERLEAVED_QUESTIONS },
        itemCount: INTERLEAVED_QUESTIONS.length,
      });
    }

    const challenge = activities.find((a) => a.type === 'journeyChallenge');
    if (challenge) {
      await updateActivity(challenge.activityId, {
        status: 'ready',
        content: { questions: JOURNEY_CHALLENGE_QUESTIONS },
        itemCount: JOURNEY_CHALLENGE_QUESTIONS.length,
      });
    }

    return { journey, modules, activities };
  } finally {
    provisionLock = false;
  }
}
