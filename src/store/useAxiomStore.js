import { create } from 'zustand';
import { loadFromStorage, saveToStorage } from '../lib/state';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../lib/constants-storage';
import { generateId } from '../lib/utils-text';

export const useAxiomStore = create((set, get) => ({
  // ─── Navigation
  mode: loadFromStorage(STORAGE_KEYS.APP_MODE, 'ops'),
  opsView: loadFromStorage(STORAGE_KEYS.OPS_VIEW, 'dashboard'),
  setMode: (mode) => { set({ mode }); saveToStorage(STORAGE_KEYS.APP_MODE, mode); },
  setOpsView: (opsView) => { set({ opsView }); saveToStorage(STORAGE_KEYS.OPS_VIEW, opsView); },

  // ─── Tasks
  tasks: loadFromStorage(STORAGE_KEYS.TASKS, []),
  addTask: (t) => {
    const task = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    const tasks = [...get().tasks, task];
    set({ tasks }); saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },
  updateTask: (id, updates) => {
    const tasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ tasks }); saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },
  deleteTask: (id) => {
    const tasks = get().tasks.filter(t => t.id !== id);
    set({ tasks }); saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },
  toggleTask: (id) => {
    const tasks = get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    set({ tasks }); saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  // ─── Journal
  journal: loadFromStorage(STORAGE_KEYS.JOURNAL, []),
  addJournalEntry: (e) => {
    const now = new Date().toISOString();
    const entry = { ...e, id: generateId(), createdAt: now, updatedAt: now };
    const journal = [...get().journal, entry];
    set({ journal }); saveToStorage(STORAGE_KEYS.JOURNAL, journal);
  },
  updateJournalEntry: (id, updates) => {
    const journal = get().journal.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    set({ journal }); saveToStorage(STORAGE_KEYS.JOURNAL, journal);
  },
  deleteJournalEntry: (id) => {
    const journal = get().journal.filter(e => e.id !== id);
    set({ journal }); saveToStorage(STORAGE_KEYS.JOURNAL, journal);
  },

  // ─── Decks
  decks: loadFromStorage(STORAGE_KEYS.DECKS, []),
  activeDeckId: loadFromStorage(STORAGE_KEYS.ACTIVE_DECK, null),
  addDeck: (d) => {
    const now = new Date().toISOString();
    const deck = { ...d, id: generateId(), createdAt: now, updatedAt: now };
    const decks = [...get().decks, deck];
    set({ decks }); saveToStorage(STORAGE_KEYS.DECKS, decks);
  },
  updateDeck: (id, updates) => {
    const decks = get().decks.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    set({ decks }); saveToStorage(STORAGE_KEYS.DECKS, decks);
  },
  deleteDeck: (id) => {
    const decks = get().decks.filter(d => d.id !== id);
    set({ decks }); saveToStorage(STORAGE_KEYS.DECKS, decks);
  },
  setActiveDeck: (id) => { set({ activeDeckId: id }); saveToStorage(STORAGE_KEYS.ACTIVE_DECK, id); },

  // ─── Pomodoro
  pomodoroSessions: loadFromStorage(STORAGE_KEYS.POMODORO_SESSIONS, []),
  addPomodoroSession: (s) => {
    const session = { ...s, id: generateId() };
    const pomodoroSessions = [...get().pomodoroSessions, session];
    set({ pomodoroSessions }); saveToStorage(STORAGE_KEYS.POMODORO_SESSIONS, pomodoroSessions);
  },

  // ─── Typing
  typingResults: loadFromStorage(STORAGE_KEYS.TYPING_RESULTS, []),
  addTypingResult: (r) => {
    const result = { ...r, id: generateId() };
    const typingResults = [...get().typingResults, result];
    set({ typingResults }); saveToStorage(STORAGE_KEYS.TYPING_RESULTS, typingResults);
  },

  // ─── Editor
  editorNotes: loadFromStorage(STORAGE_KEYS.EDITOR_NOTES, []),
  addEditorNote: (n) => {
    const now = new Date().toISOString();
    const note = { ...n, id: generateId(), createdAt: now, updatedAt: now };
    const editorNotes = [...get().editorNotes, note];
    set({ editorNotes }); saveToStorage(STORAGE_KEYS.EDITOR_NOTES, editorNotes);
  },
  updateEditorNote: (id, updates) => {
    const editorNotes = get().editorNotes.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    set({ editorNotes }); saveToStorage(STORAGE_KEYS.EDITOR_NOTES, editorNotes);
  },
  deleteEditorNote: (id) => {
    const editorNotes = get().editorNotes.filter(n => n.id !== id);
    set({ editorNotes }); saveToStorage(STORAGE_KEYS.EDITOR_NOTES, editorNotes);
  },

  // ─── Schedule
  scheduleBlocks: loadFromStorage(STORAGE_KEYS.SCHEDULE_BLOCKS, []),
  addScheduleBlock: (b) => {
    const block = { ...b, id: generateId() };
    const scheduleBlocks = [...get().scheduleBlocks, block];
    set({ scheduleBlocks }); saveToStorage(STORAGE_KEYS.SCHEDULE_BLOCKS, scheduleBlocks);
  },
  updateScheduleBlock: (id, updates) => {
    const scheduleBlocks = get().scheduleBlocks.map(b => b.id === id ? { ...b, ...updates } : b);
    set({ scheduleBlocks }); saveToStorage(STORAGE_KEYS.SCHEDULE_BLOCKS, scheduleBlocks);
  },
  deleteScheduleBlock: (id) => {
    const scheduleBlocks = get().scheduleBlocks.filter(b => b.id !== id);
    set({ scheduleBlocks }); saveToStorage(STORAGE_KEYS.SCHEDULE_BLOCKS, scheduleBlocks);
  },

  // ─── Goals
  goals: loadFromStorage(STORAGE_KEYS.GOALS, []),
  addGoal: (g) => {
    const goal = { ...g, id: generateId(), createdAt: new Date().toISOString() };
    const goals = [...get().goals, goal];
    set({ goals }); saveToStorage(STORAGE_KEYS.GOALS, goals);
  },
  updateGoal: (id, updates) => {
    const goals = get().goals.map(g => g.id === id ? { ...g, ...updates } : g);
    set({ goals }); saveToStorage(STORAGE_KEYS.GOALS, goals);
  },
  deleteGoal: (id) => {
    const goals = get().goals.filter(g => g.id !== id);
    set({ goals }); saveToStorage(STORAGE_KEYS.GOALS, goals);
  },

  // ─── Mastery
  mastery: loadFromStorage(STORAGE_KEYS.MASTERY, []),
  updateMastery: (subject, updates) => {
    const existing = get().mastery.find(m => m.subject === subject);
    let mastery;
    if (existing) {
      mastery = get().mastery.map(m => m.subject === subject ? { ...m, ...updates } : m);
    } else {
      mastery = [...get().mastery, { subject, level: 0, hoursStudied: 0, ...updates }];
    }
    set({ mastery }); saveToStorage(STORAGE_KEYS.MASTERY, mastery);
  },

  // ─── Settings
  settings: loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings }); saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  },
}));