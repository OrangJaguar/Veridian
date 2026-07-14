import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useModule } from '@/hooks/queries/useModules';
import { resolveModulePrescription } from '@/utils/failures/resolveModulePrescription';

export function useModulePrescription(moduleId) {
  const { data: module } = useModule(moduleId);

  return useQuery({
    queryKey: [...queryKeys.failureProfile(moduleId), 'prescription'],
    queryFn: () => resolveModulePrescription(module),
    enabled: Boolean(moduleId && module),
    staleTime: 60_000,
  });
}
