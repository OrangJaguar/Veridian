import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listModulesByJourney, getModule } from '@/api/entities/modules';
import { useAuth } from '@/hooks/useAuth';

export function useModules(journeyId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.modules.byJourney(journeyId),
    queryFn: () => listModulesByJourney(journeyId),
    enabled: isAuthenticated && !!journeyId,
    staleTime: 30_000,
  });
}

export function useModule(moduleId) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.modules.detail(moduleId),
    queryFn: () => getModule(moduleId),
    enabled: isAuthenticated && !!moduleId,
    staleTime: 30_000,
  });
}
