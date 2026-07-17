/**
 * Provider-neutral auth surface.
 * UI and feature code should use this module (or requireAuth) — never import the Base44 SDK directly.
 */
import { requireAuth, clearAuthCache, refreshAuth } from '@/api/requireAuth';
import { base44 } from '@/api/base44Client';

export async function getCurrentUser({ fresh = false } = {}) {
  return requireAuth({ fresh });
}

export async function isAuthenticated() {
  try {
    await requireAuth();
    return true;
  } catch {
    return false;
  }
}

export async function isAdminUser() {
  try {
    const user = await requireAuth();
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

export function signOut() {
  clearAuthCache();
  return base44.auth.logout();
}

export { clearAuthCache, refreshAuth };
