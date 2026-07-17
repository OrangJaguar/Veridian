import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { generateOverrideId } from '@/utils/schemas/ids';

async function findByOverrideId(overrideId) {
  const rows = await base44.entities.PlanOverride.filter({ overrideId });
  return rows[0] ?? null;
}

export async function listPlanOverrides(weekKey) {
  await requireAuth();
  const rows = await base44.entities.PlanOverride.filter({ active: true });
  const filtered = weekKey
    ? rows.filter((r) => r.weekKey === weekKey)
    : rows;
  return filtered.filter((r) => !r.expiresAt || r.expiresAt > Date.now());
}

export async function listAllPlanOverrides() {
  await requireAuth();
  return base44.entities.PlanOverride.filter({});
}

export async function createPlanOverride(payload) {
  const user = await requireAuth();
  const now = Date.now();
  return base44.entities.PlanOverride.create({
    overrideId: payload.overrideId ?? generateOverrideId(),
    userEmail: user.email,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...payload,
  });
}

export async function updatePlanOverride(overrideId, patch) {
  await requireAuth();
  const existing = await findByOverrideId(overrideId);
  if (!existing) throw new Error('Override not found');
  return base44.entities.PlanOverride.update(existing.id, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function deactivatePlanOverride(overrideId) {
  return updatePlanOverride(overrideId, { active: false });
}

export async function deactivateOverridesForAssignment(assignmentId) {
  await requireAuth();
  const rows = await base44.entities.PlanOverride.filter({ assignmentId, active: true });
  await Promise.all(rows.map((r) => base44.entities.PlanOverride.update(r.id, {
    active: false,
    updatedAt: Date.now(),
  })));
}

export async function clearActiveOverridesForWeek(weekKey) {
  await requireAuth();
  const rows = await listPlanOverrides(weekKey);
  await Promise.all(rows.map((r) => base44.entities.PlanOverride.update(r.id, {
    active: false,
    updatedAt: Date.now(),
  })));
}
