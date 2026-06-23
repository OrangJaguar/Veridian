import { useQuery } from '@tanstack/react-query';
import {
  fetchResearchDataHealth,
  fetchQualifyingPairs,
  fetchDataQualityFlags,
} from '@/api/admin/researchAnalytics';

export function useResearchDataHealth() {
  return useQuery({
    queryKey: ['research', 'dataHealth'],
    queryFn: fetchResearchDataHealth,
    staleTime: 30_000,
  });
}

export function useQualifyingPairs() {
  return useQuery({
    queryKey: ['research', 'qualifyingPairs'],
    queryFn: fetchQualifyingPairs,
    staleTime: 60_000,
  });
}

export function useDataQualityFlags() {
  return useQuery({
    queryKey: ['research', 'qualityFlags'],
    queryFn: fetchDataQualityFlags,
    staleTime: 60_000,
  });
}
