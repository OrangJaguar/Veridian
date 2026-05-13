import { generateId } from '../utils-text';
import { loadFromStorage, saveToStorage } from '../state';
import { STORAGE_KEYS } from '../constants-storage';

export function loadDecks() {
  return loadFromStorage(STORAGE_KEYS.DECKS, []);
}

export function saveDecks(decks) {
  saveToStorage(STORAGE_KEYS.DECKS, decks);
}

export function createDeck(name, description, color) {
  return {
    id: generateId(),
    name,
    description,
    cards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color,
  };
}

export function createFlashcard(front, back, difficulty) {
  return { id: generateId(), front, back, difficulty, ease: 2.5, interval: 1 };
}

export function getDueCards(deck) {
  const now = new Date().toISOString();
  return deck.cards.filter(c => !c.nextReview || c.nextReview <= now);
}

export function reviewCard(card, quality) {
  let { ease = 2.5, interval = 1 } = card;
  ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (quality < 3) {
    interval = 1;
  } else if (interval === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * ease);
  }
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { ...card, ease, interval, lastReviewed: new Date().toISOString(), nextReview: nextReview.toISOString() };
}