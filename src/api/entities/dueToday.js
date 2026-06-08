import { listJourneys } from '@/api/entities/journeys';
import { listAllModules } from '@/api/entities/modules';
import { listAllActivities } from '@/api/entities/activities';
import { listAllCards } from '@/api/entities/cards';
import { listAllSessions } from '@/api/entities/sessions';
import { getDueTodayItems } from '@/utils/dueToday/getDueTodayItems';

export async function fetchDueTodayItems() {
  const [journeys, modules, activities, cards, sessions] = await Promise.all([
    listJourneys({ archived: false }),
    listAllModules(),
    listAllActivities(),
    listAllCards(),
    listAllSessions(),
  ]);

  return getDueTodayItems({ journeys, modules, activities, sessions, cards });
}
