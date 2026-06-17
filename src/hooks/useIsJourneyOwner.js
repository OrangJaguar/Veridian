import { useAuth } from '@/hooks/useAuth';

export function useIsJourneyOwner(journey) {
  const { user } = useAuth();
  if (!journey?.userEmail || !user?.email) return true;
  return journey.userEmail === user.email;
}
