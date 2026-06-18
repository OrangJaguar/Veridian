import { createContext, useCallback, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { queryClient } from '@/lib/query-client';
import { clearAuthCache } from '@/api/requireAuth';
import { touchLastActive } from '@/api/entities/preferences';
import { useCurrentUser } from '@/hooks/queries/useCurrentUser';

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

  const setUser = useCallback((nextUser) => {
    queryClient.setQueryData(['auth', 'me'], nextUser ?? null);
  }, []);

  const refreshUser = useCallback(() => refetch(), [refetch]);

  const signOut = useCallback(async () => {
    await base44.auth.logout();
    clearAuthCache();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.removeQueries({ queryKey: ['preferences'] });
    queryClient.invalidateQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries({ queryKey: ['decks'] });
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
