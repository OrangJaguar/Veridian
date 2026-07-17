import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import {
  listCommitmentsByWeek,
  listOpenCommitments,
} from '@/api/entities/studyCommitments';
import { useAuth } from '@/hooks/useAuth';
import { computeCommitmentAdherence } from '@/utils/accountability/computeCommitmentAdherence';
import { getDateKey, getWeekKey } from '@/utils/weeklyPlan/weekKey';

export function useStudyCommitments(weekKey = getWeekKey()) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.studyCommitments.byWeek(weekKey),
    queryFn: () => listCommitmentsByWeek(weekKey),
    enabled: isAuthenticated && !!weekKey,
    staleTime: 30_000,
  });
}

export function useOpenCommitments() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.studyCommitments.open,
    queryFn: listOpenCommitments,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useCommitmentAdherence(weekKey = getWeekKey()) {
  const query = useStudyCommitments(weekKey);
  const adherence = computeCommitmentAdherence(query.data ?? [], {
    weekKey,
    todayKey: getDateKey(),
  });
  return { ...query, adherence };
}
