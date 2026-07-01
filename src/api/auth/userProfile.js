import { base44 } from '@/api/base44Client';
import { normalizeUsername } from '@/utils/schemas/preferences';
import { refreshAuth } from '@/api/requireAuth';

/**
 * Sync chosen username to Base44 User.full_name (dashboard "Name" column + auth.me).
 */
export async function syncAuthUserFullName(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  return base44.auth.updateMe({ full_name: normalized });
}

export async function refreshAuthUser() {
  return refreshAuth();
}
