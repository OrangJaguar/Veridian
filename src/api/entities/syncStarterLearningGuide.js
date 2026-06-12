import { listJourneys } from '@/api/entities/journeys';
import { listActivitiesByJourney, updateActivity } from '@/api/entities/activities';
import {
  STARTER_JOURNEY_META,
  LEARNING_GUIDE_CONTENT,
} from '@/fixtures/starterJourney/aiJourneyContent';

let syncLock = false;

/**
 * Push updated starter learning guide content to existing accounts (preserves progress).
 */
export async function syncStarterLearningGuideContent() {
  if (syncLock) return false;
  syncLock = true;

  try {
    const journeys = await listJourneys({ archived: false });
    const starter = journeys.find((j) => j.title === STARTER_JOURNEY_META.title);
    if (!starter) return false;

    const activities = await listActivitiesByJourney(starter.journeyId);
    const guide = activities.find((a) => a.type === 'learningGuide');
    if (!guide) return false;

    const currentVersion = guide.content?.contentVersion ?? 0;
    if (currentVersion >= LEARNING_GUIDE_CONTENT.contentVersion) return false;

    const progress = guide.content?.progress ?? { completedSectionIds: [] };

    await updateActivity(guide.activityId, {
      status: 'ready',
      content: {
        ...LEARNING_GUIDE_CONTENT,
        progress,
      },
      itemCount: LEARNING_GUIDE_CONTENT.totalSections,
    });

    return true;
  } finally {
    syncLock = false;
  }
}
