import { PREFS_KEY, DECKS_KEY, TELEMETRY_KEY, AGENDA_TASKS_KEY, AGENDA_TASK_ORDER_KEY, CALENDAR_EVENTS_KEY, JOURNAL_ENTRIES_KEY } from '../lib/constants-storage';
import { S } from '../lib/state';
import { toLocalDateKey, parseLocalDateKey, getTodayKey, addDays } from '../lib/utils-date';
import { applyTheme, applySettingsToUI } from '../lib/modals/settings-ui';
import { saveDecks } from '../lib/ops/deck-storage';
import { saveTelemetry } from '../lib/ops/telemetry-storage';
import { loadAllFromCloud, setCloudUser, isCloudEnabled } from '../lib/cloudSync';
import { base44 } from '../api/base44Client';

export function sumTelemetryDay(dayObj) {
  if (!dayObj || typeof dayObj !== 'object') return 0;
  return Number(dayObj.timeEngagedSec || 0) + Number(dayObj.cardsFlipped || 0) + Number(dayObj.correctAnswered || dayObj.globalCorrect || 0) + Number(dayObj.questionsAnswered || dayObj.globalAnswered || 0);
}

export function normalizeTelemetryDailyMap(inputDaily) {
  const source = (inputDaily && typeof inputDaily === 'object' && !Array.isArray(inputDaily)) ? inputDaily : {};
  const direct = {};
  Object.keys(source).forEach((key) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const src = source[key] || {};
    const cur = direct[key] || { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
    cur.timeEngagedSec += Number(src.timeEngagedSec || 0);
    cur.correctAnswered += Number(src.correctAnswered || src.globalCorrect || 0);
    cur.questionsAnswered += Number(src.questionsAnswered || src.globalAnswered || 0);
    cur.cardsFlipped += Number(src.cardsFlipped || 0);
    direct[key] = cur;
  });
  const shifted = {};
  Object.keys(source).forEach((key) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const [y, m, d] = key.split('-').map(Number);
    const localKey = toLocalDateKey(new Date(Date.UTC(y, m - 1, d)));
    const src = source[key] || {};
    const cur = shifted[localKey] || { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
    cur.timeEngagedSec += Number(src.timeEngagedSec || 0);
    cur.correctAnswered += Number(src.correctAnswered || src.globalCorrect || 0);
    cur.questionsAnswered += Number(src.questionsAnswered || src.globalAnswered || 0);
    cur.cardsFlipped += Number(src.cardsFlipped || 0);
    shifted[localKey] = cur;
  });
  const today = getTodayKey();
  const yesterday = toLocalDateKey(addDays(parseLocalDateKey(today), -1));
  const directToday = sumTelemetryDay(direct[today]);
  const shiftedToday = sumTelemetryDay(shifted[today]);
  const shiftedYesterday = sumTelemetryDay(shifted[yesterday]);
  if (directToday > 0 && shiftedToday < directToday && shiftedYesterday >= directToday * 0.5) return shifted;
  return direct;
}

export function applyTelemetryDelta(delta) {
  S.telemetry.timeEngagedSec += delta.timeEngagedSec || 0;
  S.telemetry.globalCorrect += delta.globalCorrect || 0;
  S.telemetry.globalAnswered += delta.globalAnswered || 0;
  S.telemetry.cardsFlipped += delta.cardsFlipped || 0;
  const dayKey = getTodayKey();
  if (!S.telemetry.daily[dayKey]) S.telemetry.daily[dayKey] = { timeEngagedSec: 0, correctAnswered: 0, questionsAnswered: 0, cardsFlipped: 0 };
  S.telemetry.daily[dayKey].timeEngagedSec += delta.timeEngagedSec || 0;
  S.telemetry.daily[dayKey].correctAnswered += delta.globalCorrect || 0;
  S.telemetry.daily[dayKey].questionsAnswered += delta.globalAnswered || 0;
  S.telemetry.daily[dayKey].cardsFlipped += delta.cardsFlipped || 0;
  saveTelemetry();
}

export function heuristicParse(text) {
  const blocks = text.trim().split(/\n\s*\n/).filter(b => b.trim() !== '');
  const parsed = [];
  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) continue;
    const blockData = { id: i.toString() };
    if (lines.length === 2 && !lines[1].startsWith('-') && !lines[1].startsWith('*')) {
      blockData.type = 'qa'; blockData.question = lines[0]; blockData.answer = lines[1];
      parsed.push(blockData); continue;
    }
    const question = lines[0];
    const options = [];
    let correctOriginalIndex = -1;
    for (let j = 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.startsWith('*')) { correctOriginalIndex = options.length; options.push({ text: line.substring(1).trim(), isCorrect: true }); }
      else if (line.startsWith('-')) { options.push({ text: line.substring(1).trim(), isCorrect: false }); }
      else { options.push({ text: line, isCorrect: false }); }
    }
    if (options.length > 0) {
      if (correctOriginalIndex === -1) { options[0].isCorrect = true; correctOriginalIndex = 0; }
      blockData.type = 'multichoice'; blockData.question = question; blockData.options = options;
      blockData.correctOriginalIndex = correctOriginalIndex; blockData.answer = options[correctOriginalIndex].text;
      parsed.push(blockData);
    }
  }
  return parsed;
}

export function saveDeck(id, title, rawText) {
  const parsed = heuristicParse(rawText);
  const existingIdx = S.decks.findIndex(d => d.id === id);
  const deckData = { id, title: title || 'Untitled Deck', rawText, parsedItems: parsed, lastEdited: Date.now() };
  if (existingIdx >= 0) S.decks[existingIdx] = deckData;
  else S.decks.push(deckData);
  saveDecks();
  return deckData;
}

export function deleteDeck(id, renderDashboard) {
  S.decks = S.decks.filter(d => d.id !== id);
  saveDecks();
  renderDashboard();
}

function flushCloudStateToLocalStorage() {
  // After loading from cloud, write S state to localStorage so that
  // loadAgendaData/loadCalendarData/loadJournalData re-read the correct data.
  localStorage.setItem(AGENDA_TASKS_KEY, JSON.stringify(S.agendaTasks));
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(S.calendarEvents));
  localStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(S.journalEntries));
  localStorage.setItem(DECKS_KEY, JSON.stringify(S.decks));
  localStorage.setItem(PREFS_KEY, JSON.stringify(S.prefs));
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(S.telemetry));
}

function loadFromLocalStorage() {
  if (localStorage.getItem(PREFS_KEY)) S.prefs = JSON.parse(localStorage.getItem(PREFS_KEY));
  if (localStorage.getItem(DECKS_KEY)) S.decks = JSON.parse(localStorage.getItem(DECKS_KEY));
  if (localStorage.getItem(TELEMETRY_KEY)) S.telemetry = JSON.parse(localStorage.getItem(TELEMETRY_KEY));
  if (!S.telemetry.daily || typeof S.telemetry.daily !== 'object') S.telemetry.daily = {};
  if (typeof S.telemetry.timeEngagedSec !== 'number') S.telemetry.timeEngagedSec = 0;
  if (typeof S.telemetry.globalCorrect !== 'number') S.telemetry.globalCorrect = 0;
  if (typeof S.telemetry.globalAnswered !== 'number') S.telemetry.globalAnswered = 0;
  if (typeof S.telemetry.cardsFlipped !== 'number') S.telemetry.cardsFlipped = 0;
}

function finalizeBoot(els, callbacks) {
  S.telemetry.daily = normalizeTelemetryDailyMap(S.telemetry.daily);
  const todayBucket = S.telemetry.daily[getTodayKey()] || {};
  S.telemetryTodayBaseline = {
    timeEngagedSec: Number(todayBucket.timeEngagedSec || 0),
    correctAnswered: Number(todayBucket.correctAnswered || 0),
    questionsAnswered: Number(todayBucket.questionsAnswered || 0),
    cardsFlipped: Number(todayBucket.cardsFlipped || 0)
  };
  saveTelemetry();
  if (S.decks.length === 0) {
    const defaultRaw = "Action Potential\nThe change in electrical potential associated with the passage of an impulse along the membrane of a muscle cell or nerve cell.\n\nWhat is the powerhouse of the cell?\n- Nucleus\n- Ribosome\n* Mitochondria\n\nCognitive Dissonance\nThe state of having inconsistent thoughts, beliefs, or attitudes.";
    saveDeck(Date.now().toString(), "Sample: Biology & Psych", defaultRaw);
  }
  callbacks.ensureCmdSchedule();
  callbacks.loadAgendaData();
  callbacks.loadCalendarData();
  callbacks.loadJournalData();
  callbacks.ensureAgendaDnDDelegates();
  callbacks.bindCalendarDragGlobal();
  if (!window.__axiomFocusPomoTick) {
    window.__axiomFocusPomoTick = true;
    window.setInterval(callbacks.tickFocusPomodoro, 1000);
  }
  applySettingsToUI(els);
  applyTheme();
  callbacks.updateHeaderModeUI();
  callbacks.renderDashboard();
}

export async function bootSystem(els, callbacks) {
  // Always load local first for instant paint
  loadFromLocalStorage();
  finalizeBoot(els, callbacks);

  // Then check if user is logged in
  try {
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      const user = await base44.auth.me();
      setCloudUser(user);
      await loadAllFromCloud(S);
      // Re-normalize after cloud load
      S.telemetry.daily = normalizeTelemetryDailyMap(S.telemetry.daily);
      const todayBucket = S.telemetry.daily[getTodayKey()] || {};
      S.telemetryTodayBaseline = {
        timeEngagedSec: Number(todayBucket.timeEngagedSec || 0),
        correctAnswered: Number(todayBucket.correctAnswered || 0),
        questionsAnswered: Number(todayBucket.questionsAnswered || 0),
        cardsFlipped: Number(todayBucket.cardsFlipped || 0)
      };
      // Flush cloud state to localStorage so load* functions read cloud data
      flushCloudStateToLocalStorage();
      callbacks.loadAgendaData();
      callbacks.loadCalendarData();
      callbacks.loadJournalData();
      applySettingsToUI(els);
      applyTheme();
      callbacks.renderDashboard();
      callbacks.onUserLoaded(user);
    } else {
      callbacks.onUserLoaded(null);
    }
  } catch (e) {
    callbacks.onUserLoaded(null);
  }
}

export async function onUserSignedIn(user, S, els, callbacks) {
  setCloudUser(user);

  // Load cloud state — do NOT migrate local data to cloud to avoid overwriting real account data
  await loadAllFromCloud(S);
  // Flush cloud state to localStorage so load* functions read cloud data
  flushCloudStateToLocalStorage();
  S.telemetry.daily = normalizeTelemetryDailyMap(S.telemetry.daily);
  const todayBucket = S.telemetry.daily[getTodayKey()] || {};
  S.telemetryTodayBaseline = {
    timeEngagedSec: Number(todayBucket.timeEngagedSec || 0),
    correctAnswered: Number(todayBucket.correctAnswered || 0),
    questionsAnswered: Number(todayBucket.questionsAnswered || 0),
    cardsFlipped: Number(todayBucket.cardsFlipped || 0)
  };
  callbacks.loadAgendaData();
  callbacks.loadCalendarData();
  callbacks.loadJournalData();
  applySettingsToUI(els);
  applyTheme();
  callbacks.renderDashboard();
}