import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { getPublicJourneyPreview } from '@/api/entities/library';

export function useLibraryPreview(journeyId) {
  return useQuery({
    queryKey: queryKeys.library.preview(journeyId),
    queryFn: () => getPublicJourneyPreview(journeyId),
    enabled: !!journeyId,
    staleTime: 60_000,
  });
}
