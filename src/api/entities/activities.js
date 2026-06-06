import { base44 } from '@/api/base44Client';
import { AuthRequiredError } from '@/api/auth';

async function requireAuth() {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) throw new AuthRequiredError();
  return base44.auth.me();
}

async function findByClientId(entity, field, value) {
  const rows = await entity.filter({ [field]: value });
  return rows[0] ?? null;
}

export async function listActivitiesByModule(moduleId) {
  await requireAuth();
  return base44.entities.Activity.filter({ moduleId });
}

export async function getActivity(activityId) {
  await requireAuth();
  return findByClientId(base44.entities.Activity, 'activityId', activityId);
}

export async function createActivity(moduleId, journeyId, payload) {
  const user = await requireAuth();
  return base44.entities.Activity.create({
    ...payload,
    moduleId,
    journeyId,
    userEmail: user.email,
    content: payload.content ?? {},
    itemCount: payload.itemCount ?? 0,
  });
}

export async function updateActivity(activityId, patch) {
  await requireAuth();
  const existing = await findByClientId(base44.entities.Activity, 'activityId', activityId);
  if (!existing) throw new Error(`Activity not found: ${activityId}`);
  return base44.entities.Activity.update(existing.id, patch);
}

export async function deleteActivity(activityId) {
  await requireAuth();
  const existing = await findByClientId(base44.entities.Activity, 'activityId', activityId);
  if (!existing) return;
  await base44.entities.Activity.delete(existing.id);
}
