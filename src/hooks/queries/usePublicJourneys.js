import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listPublicJourneys } from '@/api/entities/library';

export function usePublicJourneys({ search = '', category = 'all', sort = 'cloned' } = {}) {
  return useQuery({
    queryKey: queryKeys.library.list({ search, category, sort }),
    queryFn: () => listPublicJourneys({ search, category, sort }),
    staleTime: 60_000,
  });
}
