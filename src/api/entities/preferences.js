import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';

export async function getPreferences() {
  await requireAuth();
  const rows = await base44.entities.UserPreferences.list();
  return rows[0] ?? null;
}

export async function updatePreferences(patch) {
  const user = await requireAuth();
  const rows = await base44.entities.UserPreferences.list();
  if (rows.length > 0) {
    return base44.entities.UserPreferences.update(rows[0].id, patch);
  }
  return base44.entities.UserPreferences.create({
    ...patch,
    userEmail: user.email,
    hintsShown: patch.hintsShown ?? [],
    notificationPref: patch.notificationPref ?? 'urgent',
    defaultPrivacy: patch.defaultPrivacy ?? 'private',
  });
}
