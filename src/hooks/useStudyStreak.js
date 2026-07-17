import { useQuery } from '@tanstack/react-query';
import { listAllSessions } from '@/api/entities/sessions';
import { queryKeys } from '@/api/query-keys';
import { computeStreak } from '@/utils/streaks/computeStreak';
import { useMemo } from 'react';

export function useStudyStreak() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.catalog.allSessions,
    queryFn: listAllSessions,
    staleTime: 60_000,
  });

  const streak = useMemo(() => computeStreak(sessions), [sessions]);

  return { ...streak, isLoading };
}
