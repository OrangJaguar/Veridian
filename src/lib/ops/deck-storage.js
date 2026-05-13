import { DECKS_KEY } from '../constants-storage';
import { S } from '../state';

export function saveDecks() {
  localStorage.setItem(DECKS_KEY, JSON.stringify(S.decks));
}