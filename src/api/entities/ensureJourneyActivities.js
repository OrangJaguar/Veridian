import { createActivity } from '@/api/entities/activities';
import { generateActivityId } from '@/utils/schemas/ids';

const LAZY_JOURNEY_TYPES = [
  { type: 'cramSession', title: 'Cram Session' },
];

/**
 * Ensure journey-wide activities exist for older journeys (lazy migration).
 */
export async function ensureJourneyWideActivities(journeyId, existingActivities = []) {
  const created = [];
  for (const def of LAZY_JOURNEY_TYPES) {
    const exists = existingActivities.some((a) => a.type === def.type);
    if (exists) continue;
    const activity = await createActivity(journeyId, {
      activityId: generateActivityId(),
      moduleId: null,
      scope: 'journey',
      type: def.type,
      status: 'ready',
      title: def.title,
      description: def.title,
    });
    created.push(activity);
  }
  return created;
}
