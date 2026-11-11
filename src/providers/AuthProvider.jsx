import { createContext, useCallback, useEffect, useMemo } from 'react';
import { base44, PENDING_USERNAME_KEY } from '@/api/base44Client';
import { createUserPreferencesOnSignup } from '@/api/entities/preferences';
import { queryClient } from '@/lib/query-client';
import { clearAuthCache } from '@/api/requireAuth';
import { touchLastActive } from '@/api/entities/preferences';
import { useCurrentUser } from '@/hooks/queries/useCurrentUser';
import {
  clearInMemoryUserQueries,
  clearLegacyPersistedCache,
  stopActivePersistSubscription,
} from '@/lib/query-persist';

export const AuthContext = createContext(null);

if (typeof window !== 'undefined' && !window.__veridianAuthCallbacks) {
  window.__veridianAuthCallbacks = { onUserLoaded: null };
}

export default function AuthProvider({ children }) {
  const { data: user, isLoading, refetch } = useCurrentUser();

  useEffect(() => {
    window.__veridianAuthCallbacks.onUserLoaded = (u) => {
      queryClient.setQueryData(['auth', 'me'], u ?? null);
    };
    return () => {
      window.__veridianAuthCallbacks.onUserLoaded = null;
    };
  }, []);

  useEffect(() => {
    if (user?.email) {
      touchLastActive().catch(() => {});
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return undefined;
    const pending = sessionStorage.getItem(PENDING_USERNAME_KEY);
    if (!pending) return undefined;
    let cancelled = false;
    createUserPreferencesOnSignup({ username: pending, userEmail: user.email })
      .then(() => {
        if (!cancelled) sessionStorage.removeItem(PENDING_USERNAME_KEY);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const setUser = useCallback((nextUser) => {
    queryClient.setQueryData(['auth', 'me'], nextUser ?? null);
  }, []);

  const refreshUser = useCallback(() => refetch(), [refetch]);

  const signOut = useCallback(async () => {
    stopActivePersistSubscription();
    try {
      await base44.auth.logout();
    } catch {
      // The session is already gone after account deletion.
    }
    clearAuthCache();
    clearInMemoryUserQueries(queryClient);
    clearLegacyPersistedCache();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.removeQueries({ queryKey: ['auth'] });
  }, []);

  const value = useMemo(() => ({
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    refreshUser,
    signOut,
  }), [user, isLoading, setUser, refreshUser, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
