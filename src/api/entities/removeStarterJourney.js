import { listJourneys, deleteJourney } from '@/api/entities/journeys';
import { deleteModulesByJourney } from '@/api/entities/modules';
import { listActivitiesByJourney, deleteActivity } from '@/api/entities/activities';
import { listCardsByJourney, deleteCard } from '@/api/entities/cards';
import { listSessionsByJourney, deleteSession } from '@/api/entities/sessions';

/** Title of the deprecated auto-provisioned demo journey — removed for all users. */
export const STARTER_JOURNEY_TITLE = 'Artificial Intelligence — From Origins to Modern Systems';

/**
 * Delete the legacy starter journey and all related records for the current user.
 */
export async function removeStarterJourneyIfPresent() {
  const active = await listJourneys({ archived: false });
  const archived = await listJourneys({ archived: true });
  const starter = [...active, ...archived].find((j) => j.title === STARTER_JOURNEY_TITLE);
  if (!starter) return false;

  const { journeyId } = starter;

  const [cards, sessions, activities] = await Promise.all([
    listCardsByJourney(journeyId),
    listSessionsByJourney(journeyId),
    listActivitiesByJourney(journeyId),
  ]);

  await Promise.all([
    ...cards.map((c) => deleteCard(c.cardId)),
    ...sessions.map((s) => deleteSession(s.sessionId)),
    ...activities.map((a) => deleteActivity(a.activityId)),
  ]);

  await deleteModulesByJourney(journeyId);
  await deleteJourney(journeyId);

  return true;
}
