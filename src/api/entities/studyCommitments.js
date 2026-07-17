import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { generateCommitmentId } from '@/utils/schemas/ids';

async function findByCommitmentId(commitmentId) {
  const rows = await base44.entities.StudyCommitment.filter({ commitmentId });
  return rows[0] ?? null;
}

export async function listCommitmentsByWeek(weekKey) {
  await requireAuth();
  return base44.entities.StudyCommitment.filter({ weekKey });
}

export async function listCommitmentsByDate(scheduledDateKey) {
  await requireAuth();
  return base44.entities.StudyCommitment.filter({ scheduledDateKey });
}

export async function listOpenCommitments() {
  await requireAuth();
  const rows = await base44.entities.StudyCommitment.filter({});
  return rows.filter((c) => c.status === 'planned' || c.status === 'started');
}

export async function getCommitment(commitmentId) {
  await requireAuth();
  return findByCommitmentId(commitmentId);
}

export async function createStudyCommitment(payload) {
  const user = await requireAuth();
  const now = Date.now();

  if (payload.assignmentId) {
    const existing = await base44.entities.StudyCommitment.filter({
      assignmentId: payload.assignmentId,
      userEmail: user.email,
    });
    const open = existing.find((c) => c.status === 'planned' || c.status === 'started');
    if (open) return open;
  }

  return base44.entities.StudyCommitment.create({
    commitmentId: payload.commitmentId ?? generateCommitmentId(),
    userEmail: user.email,
    status: payload.status ?? 'planned',
    source: payload.source ?? 'plan',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    sessionId: null,
    ...payload,
  });
}

export async function updateStudyCommitment(commitmentId, patch) {
  await requireAuth();
  const existing = await findByCommitmentId(commitmentId);
  if (!existing) throw new Error('Commitment not found');
  return base44.entities.StudyCommitment.update(existing.id, {
    ...patch,
    updatedAt: Date.now(),
  });
}

export async function linkSessionToCommitment(commitmentId, sessionId) {
  const existing = await findByCommitmentId(commitmentId);
  if (!existing) return null;
  if (existing.status === 'completed') return existing;
  return updateStudyCommitment(commitmentId, {
    sessionId,
    status: existing.status === 'planned' ? 'started' : existing.status,
  });
}

export async function completeCommitmentForSession(sessionId, { completedAt = Date.now() } = {}) {
  await requireAuth();
  const rows = await base44.entities.StudyCommitment.filter({ sessionId });
  const open = rows.find((c) => c.status === 'planned' || c.status === 'started');
  if (!open) return null;
  return updateStudyCommitment(open.commitmentId, {
    status: 'completed',
    completedAt,
  });
}

/**
 * Complete the best matching open commitment for a finished session
 * when no sessionId link exists yet (fallback match).
 */
export async function completeMatchingCommitment({
  journeyId,
  activityId,
  moduleId = null,
  dateKey,
  sessionId,
  completedAt = Date.now(),
}) {
  await requireAuth();
  const rows = await base44.entities.StudyCommitment.filter({
    journeyId,
    activityId,
  });
  const candidates = rows
    .filter((c) => c.status === 'planned' || c.status === 'started')
    .filter((c) => !moduleId || !c.moduleId || c.moduleId === moduleId)
    .filter((c) => !c.sessionId || c.sessionId === sessionId)
    .sort((a, b) => {
      const aMatch = a.scheduledDateKey === dateKey ? 0 : 1;
      const bMatch = b.scheduledDateKey === dateKey ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });

  const target = candidates[0];
  if (!target) return null;
  return updateStudyCommitment(target.commitmentId, {
    status: 'completed',
    sessionId,
    completedAt,
  });
}

export async function cancelCommitmentsForAssignment(assignmentId) {
  await requireAuth();
  const rows = await base44.entities.StudyCommitment.filter({ assignmentId });
  await Promise.all(
    rows
      .filter((c) => c.status === 'planned' || c.status === 'started')
      .map((c) => updateStudyCommitment(c.commitmentId, { status: 'cancelled' })),
  );
}
