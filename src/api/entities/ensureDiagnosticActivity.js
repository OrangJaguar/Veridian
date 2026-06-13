import { createActivity } from '@/api/entities/activities';
import { generateActivityId } from '@/utils/schemas/ids';

/**
 * Ensure a journey-scoped diagnostic activity exists (for journeys created before scaffold update).
 */
export async function ensureDiagnosticActivity(journeyId, existingActivities = []) {
  const found = existingActivities.find((a) => a.type === 'diagnostic' && a.scope === 'journey');
  if (found) return found;

  return createActivity(journeyId, {
    activityId: generateActivityId(),
    moduleId: null,
    scope: 'journey',
    type: 'diagnostic',
    status: 'ready',
    title: 'Diagnostic Assessment',
    description: 'Initial placement assessment',
  });
}
