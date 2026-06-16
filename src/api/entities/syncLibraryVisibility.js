import { listActivitiesByJourney } from '@/api/entities/activities';
import { listModulesByJourney, updateModule } from '@/api/entities/modules';
import { updateActivity } from '@/api/entities/activities';
import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';

/**
 * Sync libraryVisible on all modules and activities for a journey.
 */
export async function syncLibraryVisibility(journeyId, visible) {
  await requireAuth();
  const [modules, activities] = await Promise.all([
    listModulesByJourney(journeyId),
    listActivitiesByJourney(journeyId),
  ]);

  await Promise.all([
    ...modules.map((mod) => {
      const row = mod;
      if (!row.id) return Promise.resolve();
      return base44.entities.Module.update(row.id, { libraryVisible: visible });
    }),
    ...activities.map((act) => {
      if (!act.id) return Promise.resolve();
      return base44.entities.Activity.update(act.id, { libraryVisible: visible });
    }),
  ]);
}

export async function setModulesLibraryVisible(journeyId, visible) {
  const modules = await listModulesByJourney(journeyId);
  await Promise.all(
    modules.map((mod) => updateModule(mod.moduleId, { libraryVisible: visible })),
  );
  const activities = await listActivitiesByJourney(journeyId);
  await Promise.all(
    activities.map((act) => updateActivity(act.activityId, { libraryVisible: visible })),
  );
}
