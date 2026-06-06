import { base44 } from '@/api/base44Client';
import { AuthRequiredError } from '@/api/auth';

async function requireAuth() {
  const authed = await base44.auth.isAuthenticated();
  if (!authed) throw new AuthRequiredError();
  return base44.auth.me();
}

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
