import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryKeys } from '@/api/query-keys';
import { fetchAiQuotaStatus } from '@/api/ai/quota';
import { useAuth } from '@/hooks/useAuth';

export function useAiQuota() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.aiQuota,
    queryFn: fetchAiQuotaStatus,
    enabled: isAuthenticated,
    staleTime: 45_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiQuota });
    };
    window.addEventListener('veridian-ai-quota-changed', refresh);
    return () => window.removeEventListener('veridian-ai-quota-changed', refresh);
  }, [queryClient]);

  return query;
}
