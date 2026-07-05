import { useMemo } from 'react';
import { usePreferences } from '@/hooks/queries/usePreferences';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { listAllSessions } from '@/api/entities/sessions';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function useMaiSurveyEligibility() {
  const { data: preferences } = usePreferences();
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.catalog.allSessions,
    queryFn: listAllSessions,
    staleTime: 60_000,
  });

  return useMemo(() => {
    if (!preferences?.createdAt) return { eligible: false, dismissed: false };
    if (preferences.maiSurveyOnboardingCompletedAt) {
      return { eligible: false, dismissed: false };
    }
    if (preferences.maiSurveyPromptDismissedAt) {
      return { eligible: false, dismissed: true };
    }

    const daysActive = Math.floor((Date.now() - preferences.createdAt) / MS_PER_DAY);
    const completedSessions = sessions.filter((s) => s.status === 'completed').length;
    const eligible = daysActive >= 3 || completedSessions >= 3;

    return { eligible, dismissed: false };
  }, [preferences, sessions]);
}
