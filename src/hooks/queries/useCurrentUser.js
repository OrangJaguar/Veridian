import { useQuery } from '@tanstack/react-query';
import { requireAuth } from '@/api/requireAuth';
import { AuthRequiredError } from '@/api/auth';

async function fetchCurrentUser() {
  try {
    return await requireAuth();
  } catch (err) {
    if (err instanceof AuthRequiredError) return null;
    throw err;
  }
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      const status = error?.status ?? error?.response?.status;
      if (status === 429) return false;
      return failureCount < 1;
    },
  });
}
