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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function cloudLoadTasks() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserTask.list();
  return records.map(r => ({ id: r.taskId, title: r.title, due: r.due, priority: r.priority || '', class: r.class || '', notes: r.notes || '', type: r.type, completed: !!r.completed, completedAt: r.completedAt, createdAt: r.created_date, _cloudId: r.id }));
}

export async function cloudSaveTask(task) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserTask.filter({ taskId: task.id });
  const payload = { taskId: task.id, title: task.title, due: task.due || '', priority: task.priority || '', class: task.class || '', notes: task.notes || '', type: task.type, completed: !!task.completed, completedAt: task.completedAt || '' };
  if (existing.length > 0) await base44.entities.UserTask.update(existing[0].id, payload);
  else await base44.entities.UserTask.create({ ...payload, userEmail: _currentUser?.email || '' });
}

export async function cloudDeleteTask(taskId) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserTask.filter({ taskId });
  for (const r of existing) await base44.entities.UserTask.delete(r.id);
}

export async function cloudSaveAllTasks(tasks) {
  if (!isCloudEnabled()) return;
  await Promise.all(tasks.map(t => cloudSaveTask(t)));
}

// ─── Calendar Events ──────────────────────────────────────────────────────────

export async function cloudLoadCalendarEvents() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserCalendarEvent.list();
  return records.map(r => ({ id: r.eventId, title: r.title, start: r.start, end: r.end, allDay: !!r.allDay, color: r.color || '#7f8aa5', repeatRule: r.repeatRule || 'none', repeatDays: r.repeatDays || [], notes: r.notes || '', _cloudId: r.id }));
}

export async function cloudSaveCalendarEvent(evt) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserCalendarEvent.filter({ eventId: evt.id });
  const payload = { eventId: evt.id, title: evt.title, start: evt.start, end: evt.end, allDay: !!evt.allDay, color: evt.color || '#7f8aa5', repeatRule: evt.repeatRule || 'none', repeatDays: evt.repeatDays || [], notes: evt.notes || '' };
  if (existing.length > 0) await base44.entities.UserCalendarEvent.update(existing[0].id, payload);
  else await base44.entities.UserCalendarEvent.create({ ...payload, userEmail: _currentUser?.email || '' });
}

export async function cloudDeleteCalendarEvent(eventId) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserCalendarEvent.filter({ eventId });
  for (const r of existing) await base44.entities.UserCalendarEvent.delete(r.id);
}

export async function cloudSaveAllCalendarEvents(events) {
  if (!isCloudEnabled()) return;
  await Promise.all(events.map(e => cloudSaveCalendarEvent(e)));
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export async function cloudLoadJournalEntries() {
  if (!isCloudEnabled()) return null;
  const records = await base44.entities.UserJournalEntry.list();
  const map = {};
  records.forEach(r => { map[r.dateKey] = { content: r.content || '', updatedAt: r.updatedAt || 0, _cloudId: r.id }; });
  return map;
}

export async function cloudSaveJournalEntry(dateKey, entry) {
  if (!isCloudEnabled()) return;
  const existing = await base44.entities.UserJournalEntry.filter({ dateKey });
  const payload = { dateKey, content: entry.content || '', updatedAt: entry.updatedAt || Date.now() };
  if (existing.length > 0) await base44.entities.UserJournalEntry.update(existing[0].id, payload);
  else await base44.entities.UserJournalEntry.create({ ...payload, userEmail: _currentUser?.email || '' });
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
  // Merge strategy: local data + cloud data, no duplicates (by ID)
  try {
    const [cloudDecks, cloudTasks, cloudEvents, cloudJournal, cloudTelemetry] = await Promise.all([
      cloudLoadDecks(), cloudLoadTasks(), cloudLoadCalendarEvents(), cloudLoadJournalEntries(), cloudLoadTelemetry()
    ]);

    // Decks — merge by deckId, local wins on conflict
    const cloudDeckIds = new Set((cloudDecks || []).map(d => d.id));
    const decksToUpload = (localState.decks || []).filter(d => !cloudDeckIds.has(d.id));
    await Promise.all(decksToUpload.map(d => cloudSaveDeck(d)));

    // Tasks — merge by taskId
    const cloudTaskIds = new Set((cloudTasks || []).map(t => t.id));
    const tasksToUpload = (localState.agendaTasks || []).filter(t => !cloudTaskIds.has(t.id));
    await Promise.all(tasksToUpload.map(t => cloudSaveTask(t)));

    // Calendar events — merge by eventId
    const cloudEventIds = new Set((cloudEvents || []).map(e => e.id));
    const eventsToUpload = (localState.calendarEvents || []).filter(e => !cloudEventIds.has(e.id));
    await Promise.all(eventsToUpload.map(e => cloudSaveCalendarEvent(e)));

    // Journal — merge by dateKey, local wins
    const existingKeys = new Set(Object.keys(cloudJournal || {}));
    const entriesToUpload = Object.entries(localState.journalEntries || {}).filter(([k]) => !existingKeys.has(k));
    await Promise.all(entriesToUpload.map(([k, v]) => cloudSaveJournalEntry(k, v)));

    // Telemetry — merge daily map, sum overlapping days
    if (localState.telemetry) {
      const mergedDaily = { ...(cloudTelemetry?.daily || {}) };
      Object.entries(localState.telemetry.daily || {}).forEach(([k, v]) => {
        if (mergedDaily[k]) {
          mergedDaily[k] = { timeEngagedSec: (mergedDaily[k].timeEngagedSec || 0) + (v.timeEngagedSec || 0), correctAnswered: (mergedDaily[k].correctAnswered || 0) + (v.correctAnswered || 0), questionsAnswered: (mergedDaily[k].questionsAnswered || 0) + (v.questionsAnswered || 0), cardsFlipped: (mergedDaily[k].cardsFlipped || 0) + (v.cardsFlipped || 0) };
        } else { mergedDaily[k] = v; }
      });
      await cloudSaveTelemetry({ daily: mergedDaily, timeEngagedSec: (cloudTelemetry?.timeEngagedSec || 0) + (localState.telemetry.timeEngagedSec || 0), globalCorrect: (cloudTelemetry?.globalCorrect || 0) + (localState.telemetry.globalCorrect || 0), globalAnswered: (cloudTelemetry?.globalAnswered || 0) + (localState.telemetry.globalAnswered || 0), cardsFlipped: (cloudTelemetry?.cardsFlipped || 0) + (localState.telemetry.cardsFlipped || 0) });
    }

    // Prefs
    await cloudSavePreferences(localPrefs);
    return true;
  } catch (e) {
    console.error('Migration error:', e);
    return false;
  }
}

// ─── Full load from cloud into S ─────────────────────────────────────────────

export async function loadAllFromCloud(S) {
  const [decks, tasks, events, journal, telemetry, prefs] = await Promise.all([
    cloudLoadDecks(), cloudLoadTasks(), cloudLoadCalendarEvents(), cloudLoadJournalEntries(), cloudLoadTelemetry(), cloudLoadPreferences()
  ]);

  if (decks) S.decks = decks;
  if (tasks) { S.agendaTasks = tasks; }
  if (events) S.calendarEvents = events;
  if (journal) S.journalEntries = journal;
  if (telemetry) {
    S.telemetry = { daily: telemetry.daily || {}, timeEngagedSec: telemetry.timeEngagedSec || 0, globalCorrect: telemetry.globalCorrect || 0, globalAnswered: telemetry.globalAnswered || 0, cardsFlipped: telemetry.cardsFlipped || 0 };
  }
  if (prefs) {
    S.prefs = { themeDark: !!prefs.themeDark, haptics: prefs.haptics !== false, audio: prefs.audio !== false, strictMode: !!prefs.strictMode };
  }
}