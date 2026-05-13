import { DECKS_KEY } from '../constants-storage';
import { S } from '../state';
import { cloudSaveDeck, cloudDeleteDeck, isCloudEnabled } from '../cloudSync';

export function saveDecks() {
  localStorage.setItem(DECKS_KEY, JSON.stringify(S.decks));
}

export async function saveDeckCloud(deck) {
  saveDecks();
  if (isCloudEnabled()) await cloudSaveDeck(deck);
}

export async function deleteDeckCloud(deckId) {
  if (isCloudEnabled()) await cloudDeleteDeck(deckId);
}