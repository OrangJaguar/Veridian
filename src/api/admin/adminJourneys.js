import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { createJourney } from '@/api/entities/journeys';
import { createModules } from '@/api/entities/modules';
import { scaffoldJourneyActivities } from '@/api/entities/journeyScaffold';
import { generateJourneyId, generateModuleId } from '@/utils/schemas/ids';

export async function listAdminJourneys() {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  const rows = await base44.entities.Journey.list();
  return rows
    .filter((j) => j.isAdminAuthored === true)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export async function createAdminJourney(payload) {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');

  const journeyId = generateJourneyId();
  const now = Date.now();

  const journey = await createJourney({
    journeyId,
    subject: payload.subject,
    title: payload.title,
    examType: payload.examType ?? 'AP',
    difficultyLevel: payload.difficultyLevel ?? '',
    shortDescription: payload.shortDescription ?? '',
    longDescription: payload.longDescription ?? '',
    targetAudience: payload.targetAudience ?? '',
    estimatedStudyHours: payload.estimatedStudyHours ?? null,
    coverColor: payload.coverColor ?? '#18181b',
    coverImageUrl: payload.coverImageUrl ?? '',
    tags: payload.tags ?? ['AP'],
    isPublic: false,
    isAdminAuthored: true,
    publishStatus: 'draft',
    isVeridianCertified: false,
    priorKnowledge: 'some',
    createdAt: now,
    updatedAt: now,
  });

  const modules = await createModules(journeyId, [{
    moduleId: generateModuleId(),
    name: 'Module 1',
    description: '',
    order: 0,
    stage: 'A',
    masteryScore: 0,
    moduleStatus: 'draft',
    estimatedStudyMinutes: 60,
    knowledgeMap: { concepts: [] },
    libraryVisible: false,
  }]);

  await scaffoldJourneyActivities(journeyId, modules);

  return { journey, journeyId, modules };
}

export async function validateAdminJourney(journeyId) {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  const res = await base44.functions.invoke('adminPublishCertifiedJourney', {
    action: 'validate',
    journeyId,
  });
  return res?.data ?? res;
}

export async function publishAdminJourney(journeyId) {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  const res = await base44.functions.invoke('adminPublishCertifiedJourney', {
    action: 'publish',
    journeyId,
  });
  if (res?.error) throw new Error(res.error.message ?? 'Publish failed');
  return res?.data ?? res;
}

export async function unpublishAdminJourney(journeyId) {
  const user = await requireAuth();
  if (user.role !== 'admin') throw new Error('Forbidden');
  const res = await base44.functions.invoke('adminPublishCertifiedJourney', {
    action: 'unpublish',
    journeyId,
  });
  if (res?.error) throw new Error(res.error.message ?? 'Unpublish failed');
  return res?.data ?? res;
}
