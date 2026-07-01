import { base44 } from '@/api/base44Client';
import { AuthRequiredError } from '@/api/auth';

const CACHE_MS = 5 * 60_000;

let cachedUser = null;
let cacheExpiry = 0;
let inflight = null;

function isRateLimitError(err) {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  const message = err?.message ?? '';
  return status === 429 || /429|too many requests/i.test(message);
}

/**
 * Cached auth check — avoids redundant isAuthenticated + me() calls.
 * @param {{ fresh?: boolean }} [options]
 */
export async function requireAuth({ fresh = false } = {}) {
  if (fresh) {
    clearAuthCache();
  } else {
    const now = Date.now();
    if (cachedUser && now < cacheExpiry) return cachedUser;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      // Prefer me() — a valid token can outlive a stale isAuthenticated() flip.
      try {
        const directUser = await base44.auth.me();
        if (directUser?.email || directUser?.id) {
          cachedUser = directUser;
          cacheExpiry = Date.now() + CACHE_MS;
          return directUser;
        }
      } catch (meErr) {
        if (cachedUser && isRateLimitError(meErr)) return cachedUser;
      }

      const authed = await base44.auth.isAuthenticated();
      if (!authed) throw new AuthRequiredError();
      const user = await base44.auth.me();
      cachedUser = user;
      cacheExpiry = Date.now() + CACHE_MS;
      return user;
    } catch (err) {
      if (cachedUser && isRateLimitError(err)) {
        return cachedUser;
      }
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearAuthCache() {
  cachedUser = null;
  cacheExpiry = 0;
  inflight = null;
}

/** Force a fresh auth read (e.g. before a new AI batch). */
export async function refreshAuth() {
  return requireAuth({ fresh: true });
}
