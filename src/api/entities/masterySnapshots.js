import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { generateSnapshotId } from '@/utils/schemas/ids';

async function findBySnapshotId(snapshotId) {
  const rows = await base44.entities.MasterySnapshot.filter({ snapshotId });
  return rows[0] ?? null;
}

export async function getMasterySnapshot(userEmail, moduleId, snapshotDay) {
  await requireAuth();
  const rows = await base44.entities.MasterySnapshot.filter({
    userEmail,
    moduleId,
    snapshotDay,
  });
  return rows[0] ?? null;
}

export async function listMasterySnapshotsByModule(moduleId) {
  await requireAuth();
  return base44.entities.MasterySnapshot.filter({ moduleId });
}

export async function listMasterySnapshotsByJourney(journeyId) {
  await requireAuth();
  return base44.entities.MasterySnapshot.filter({ journeyId });
}

export async function createMasterySnapshot(payload) {
  const user = await requireAuth();
  const existing = await getMasterySnapshot(user.email, payload.moduleId, payload.snapshotDay);
  if (existing) return existing;

  return base44.entities.MasterySnapshot.create({
    snapshotId: payload.snapshotId ?? generateSnapshotId(),
    userEmail: user.email,
    ...payload,
  });
}
