/**
 * Cloud sync adapter — wraps Base44 entities.
 * All methods are no-ops when user is not logged in (guest mode).
 */
import { base44 } from '../api/base44Client';

let _currentUser = null;

export function setCloudUser(user) { _currentUser = user; }
export function getCloudUser() { return _currentUser; }
export function isCloudEnabled() { return !!_currentUser; }

// ─── Decks ────────────────────────────────────────────────────────────────────

export async function cloudLoadDecks() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserDeck.list();
  return records.map(r => ({ id: r.deckId, title: r.title, rawText: r.rawText, parsedItems: r.parsedItems || [], lastEdited: r.lastEdited || Date.now(), _cloudId: r.id }));
}

export async function cloudSaveDeck(deck) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserDeck.filter({ deckId: deck.id });
  const payload = { deckId: deck.id, title: deck.title, rawText: deck.rawText, parsedItems: deck.parsedItems, lastEdited: deck.lastEdited };
  if (existing.length > 0) await base44.entities.UserDeck.update(existing[0].id, payload);
  else await base44.entities.UserDeck.create({ ...payload, userEmail: _currentUser?.email || '' });
}

export async function cloudDeleteDeck(deckId) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserDeck.filter({ deckId });
  for (const r of existing) await base44.entities.UserDeck.delete(r.id);
}

// ─── Telemetry ────────────────────────────────────────────────────────────────

export async function cloudLoadTelemetry() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserTelemetry.list();
  if (records.length === 0) return null;
  return records[0];
}

export async function cloudSaveTelemetry(telemetry) {
  if (!isCloudEnabled()) return;
  const records = await base44.entities.UserTelemetry.list();
  const payload = { daily: telemetry.daily, timeEngagedSec: telemetry.timeEngagedSec, globalCorrect: telemetry.globalCorrect, globalAnswered: telemetry.globalAnswered, cardsFlipped: telemetry.cardsFlipped };
  if (records.length > 0) await base44.entities.UserTelemetry.update(records[0].id, payload);
  else await base44.entities.UserTelemetry.create({ ...payload, userEmail: _currentUser?.email || '' });
}

// ─── Preferences ─────────────────────────────────────────────────────────────

export async function cloudLoadPreferences() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserPreferences.list();
  if (records.length === 0) return null;
  return records[0];
}

export async function cloudSavePreferences(prefs) {
  if (!isCloudEnabled()) return;
  const records = await base44.entities.UserPreferences.list();
  const payload = { themeDark: !!prefs.themeDark, haptics: !!prefs.haptics, audio: !!prefs.audio, strictMode: !!prefs.strictMode };
  if (records.length > 0) await base44.entities.UserPreferences.update(records[0].id, payload);
  else await base44.entities.UserPreferences.create({ ...payload, userEmail: _currentUser?.email || '' });
}

// ─── Migration: local → cloud ─────────────────────────────────────────────────

export async function migrateLocalToCloud(localState, localPrefs) {
  try {
    const [cloudDecks, cloudTelemetry] = await Promise.all([
      cloudLoadDecks(), cloudLoadTelemetry()
    ]);

    const cloudDeckIds = new Set((cloudDecks || []).map(d => d.id));
    const decksToUpload = (localState.decks || []).filter(d => !cloudDeckIds.has(d.id));
    await Promise.all(decksToUpload.map(d => cloudSaveDeck(d)));

    if (localState.telemetry) {
      const mergedDaily = { ...(cloudTelemetry?.daily || {}) };
      Object.entries(localState.telemetry.daily || {}).forEach(([k, v]) => {
        if (mergedDaily[k]) {
          mergedDaily[k] = { timeEngagedSec: (mergedDaily[k].timeEngagedSec || 0) + (v.timeEngagedSec || 0), correctAnswered: (mergedDaily[k].correctAnswered || 0) + (v.correctAnswered || 0), questionsAnswered: (mergedDaily[k].questionsAnswered || 0) + (v.questionsAnswered || 0), cardsFlipped: (mergedDaily[k].cardsFlipped || 0) + (v.cardsFlipped || 0) };
        } else { mergedDaily[k] = v; }
      });
      await cloudSaveTelemetry({ daily: mergedDaily, timeEngagedSec: (cloudTelemetry?.timeEngagedSec || 0) + (localState.telemetry.timeEngagedSec || 0), globalCorrect: (cloudTelemetry?.globalCorrect || 0) + (localState.telemetry.globalCorrect || 0), globalAnswered: (cloudTelemetry?.globalAnswered || 0) + (localState.telemetry.globalAnswered || 0), cardsFlipped: (cloudTelemetry?.cardsFlipped || 0) + (localState.telemetry.cardsFlipped || 0) });
    }

    await cloudSavePreferences(localPrefs);
    return true;
  } catch (e) {
    console.error('Migration error:', e);
    return false;
  }
}

// ─── Full load from cloud into S ─────────────────────────────────────────────

export async function loadAllFromCloud(S) {
  const [decks, telemetry, prefs] = await Promise.all([
    cloudLoadDecks(), cloudLoadTelemetry(), cloudLoadPreferences()
  ]);

  if (decks) S.decks = decks;
  if (telemetry) {
    S.telemetry = { daily: telemetry.daily || {}, timeEngagedSec: telemetry.timeEngagedSec || 0, globalCorrect: telemetry.globalCorrect || 0, globalAnswered: telemetry.globalAnswered || 0, cardsFlipped: telemetry.cardsFlipped || 0 };
  }
  if (prefs) {
    S.prefs = { themeDark: !!prefs.themeDark, haptics: prefs.haptics !== false, audio: prefs.audio !== false, strictMode: !!prefs.strictMode };
  }
}
