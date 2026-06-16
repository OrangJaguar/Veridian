import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { getJourney, updateJourney } from '@/api/entities/journeys';
import { listModulesByJourney } from '@/api/entities/modules';
import { listActivitiesByJourney } from '@/api/entities/activities';
import { getPreferences } from '@/api/entities/preferences';
import { setModulesLibraryVisible } from '@/api/entities/syncLibraryVisibility';
import {
  MIN_MODULES_TO_PUBLISH,
  MIN_TAGS_TO_PUBLISH,
  getJourneyCategory,
  matchesLibrarySearch,
  sortPublicJourneys,
} from '@/lib/library/libraryTags';

function stripJourneyForPublic(journey) {
  if (!journey) return null;
  const {
    userEmail,
    weeklyPlanSnapshot,
    sources,
    diagnosticSummary,
    ...safe
  } = journey;
  return {
    ...safe,
    userEmail: undefined,
    sources: journey.showSources ? journey.sources : undefined,
  };
}

/**
 * List public journeys (works logged out if RLS allows).
 */
export async function listPublicJourneys({
  search = '',
  category = 'all',
  sort = 'cloned',
} = {}) {
  const rows = await base44.entities.Journey.filter({ isPublic: true });
  const active = rows.filter((j) => !j.archived);

  const filtered = active.filter(
    (j) => matchesLibrarySearch(j, search) && (
      category === 'all' || getJourneyCategory(j) === category
    ),
  );

  return sortPublicJourneys(filtered, sort);
}

/**
 * Public preview: journey + modules + activity type summary.
 */
export async function getPublicJourneyPreview(journeyId) {
  const journeys = await base44.entities.Journey.filter({ journeyId });
  const journey = journeys[0];
  if (!journey?.isPublic) {
    throw new Error('Journey not found or not public');
  }

  const [modules, activities] = await Promise.all([
    base44.entities.Module.filter({ journeyId }),
    base44.entities.Activity.filter({ journeyId }),
  ]);

  const sortedModules = modules
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((mod) => ({
      moduleId: mod.moduleId,
      name: mod.name,
      description: mod.description,
      order: mod.order,
      activityTypes: activities
        .filter((a) => a.moduleId === mod.moduleId)
        .map((a) => a.type),
    }));

  return {
    journey: stripJourneyForPublic(journey),
    modules: sortedModules,
    moduleCount: sortedModules.length,
  };
}

export async function getPublishEligibility(journeyId) {
  const user = await requireAuth();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.userEmail && journey.userEmail !== user.email) {
    throw new Error('Not authorized');
  }

  const [modules, activities] = await Promise.all([
    listModulesByJourney(journeyId),
    listActivitiesByJourney(journeyId),
  ]);

  const moduleActivityOk = modules.every((mod) =>
    activities.some((a) => a.moduleId === mod.moduleId),
  );

  const checks = {
    moduleCount: modules.length,
    modulesOk: modules.length >= MIN_MODULES_TO_PUBLISH,
    activitiesOk: moduleActivityOk && modules.length > 0,
    tagsOk: (journey.tags ?? []).length >= MIN_TAGS_TO_PUBLISH,
    tagCount: (journey.tags ?? []).length,
  };

  return {
    ...checks,
    canPublish: checks.modulesOk && checks.activitiesOk && checks.tagsOk,
  };
}

export async function publishJourney(journeyId, { tags } = {}) {
  const user = await requireAuth();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.userEmail !== user.email) throw new Error('Not authorized');

  const nextTags = tags ?? journey.tags ?? [];
  await updateJourney(journeyId, { tags: nextTags });

  const eligibility = await getPublishEligibility(journeyId);
  if (!eligibility.canPublish) {
    throw new Error('Journey does not meet publish requirements');
  }

  let creatorUsername = journey.creatorUsername;
  if (!creatorUsername) {
    const prefs = await getPreferences().catch(() => null);
    creatorUsername = prefs?.username ?? user.email?.split('@')[0] ?? 'student';
  }

  const now = Date.now();
  const category = getJourneyCategory({ tags: nextTags, libraryCategory: journey.libraryCategory });

  await updateJourney(journeyId, {
    isPublic: true,
    publishedAt: journey.publishedAt ?? now,
    creatorUsername,
    tags: nextTags,
    libraryCategory: category,
  });

  await setModulesLibraryVisible(journeyId, true);

  return getJourney(journeyId);
}

export async function unpublishJourney(journeyId) {
  const user = await requireAuth();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.userEmail !== user.email) throw new Error('Not authorized');

  await updateJourney(journeyId, { isPublic: false });
  await setModulesLibraryVisible(journeyId, false);

  return getJourney(journeyId);
}

export async function updateJourneyLibraryMeta(journeyId, { tags, isPublic }) {
  const user = await requireAuth();
  const journey = await getJourney(journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.userEmail !== user.email) throw new Error('Not authorized');

  if (tags != null) {
    await updateJourney(journeyId, {
      tags,
      libraryCategory: getJourneyCategory({ tags }),
    });
  }

  if (isPublic === true && !journey.isPublic) {
    return publishJourney(journeyId, { tags: tags ?? journey.tags });
  }
  if (isPublic === false && journey.isPublic) {
    return unpublishJourney(journeyId);
  }

  return getJourney(journeyId);
}

export async function syncCreatorUsernameOnJourneys(username) {
  const user = await requireAuth();
  const rows = await base44.entities.Journey.filter({ userEmail: user.email, isPublic: true });
  await Promise.all(
    rows.map((j) => updateJourney(j.journeyId, { creatorUsername: username })),
  );
}
