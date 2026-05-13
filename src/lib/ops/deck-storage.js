import { DECKS_KEY } from '../constants-storage';
import { S } from '../state';

export function saveDecks(): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(S.decks));
}