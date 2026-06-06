import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DECKS_KEY } from '@/lib/constants-storage';

async function fetchDecks() {
  const authed = await base44.auth.isAuthenticated();
  if (authed) {
    return base44.entities.UserDeck.list();
  }
  try {
    const raw = localStorage.getItem(DECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: fetchDecks,
    staleTime: 30_000,
  });
}
