import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchAdminSummaryStats,
  fetchAdminSignupTrend,
  queryAdminConversation,
} from '@/api/admin/adminAnalytics';

export function useAdminSummaryStats() {
  return useQuery({
    queryKey: ['admin', 'summary'],
    queryFn: fetchAdminSummaryStats,
    staleTime: 60_000,
  });
}

export function useAdminSignupTrend() {
  return useQuery({
    queryKey: ['admin', 'signupTrend'],
    queryFn: fetchAdminSignupTrend,
    staleTime: 60_000,
  });
}

export function useAdminQuery() {
  return useMutation({
    mutationFn: queryAdminConversation,
  });
}
