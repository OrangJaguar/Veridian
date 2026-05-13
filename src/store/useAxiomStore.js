// Legacy Zustand store — not used by the imperative engine (runAxiomApp).
// Kept as a stub to avoid import errors from any remaining references.
import { create } from 'zustand';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const KEYS = {
  APP_MODE: 'axiom_app_mode',
  OPS_VIEW: 'axiom_ops_view',
  TASKS: 'axiom_tasks',
  JOURNAL: 'axiom_journal',
  DECKS: 'axiom_decks',
  ACTIVE_DECK: 'axiom_active_deck',
  POMODORO_SESSIONS: 'axiom_pomodoro_sessions',
  TYPING_RESULTS: 'axiom_typing_results',
  EDITOR_NOTES: 'axiom_editor_notes',
  SCHEDULE_BLOCKS: 'axiom_schedule_blocks',
  GOALS: 'axiom_goals',
  MASTERY: 'axiom_mastery',
  SETTINGS: 'axiom_settings',
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: '#6366f1',
  fontSize: 'md',
};

export const useAxiomStore = create((set, get) => ({
  mode: load(KEYS.APP_MODE, 'ops'),
  opsView: load(KEYS.OPS_VIEW, 'dashboard'),
  setMode: (mode) => { set({ mode }); save(KEYS.APP_MODE, mode); },
  setOpsView: (opsView) => { set({ opsView }); save(KEYS.OPS_VIEW, opsView); },

  tasks: load(KEYS.TASKS, []),
  addTask: (t) => {
    const task = { ...t, id: generateId(), createdAt: new Date().toISOString() };
    const tasks = [...get().tasks, task];
    set({ tasks }); save(KEYS.TASKS, tasks);
  },
  updateTask: (id, updates) => {
    const tasks = get().tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    set({ tasks }); save(KEYS.TASKS, tasks);
  },
  deleteTask: (id) => {
    const tasks = get().tasks.filter(t => t.id !== id);
    set({ tasks }); save(KEYS.TASKS, tasks);
  },
  toggleTask: (id) => {
    const tasks = get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    set({ tasks }); save(KEYS.TASKS, tasks);
  },

  journal: load(KEYS.JOURNAL, []),
  addJournalEntry: (e) => {
    const now = new Date().toISOString();
    const entry = { ...e, id: generateId(), createdAt: now, updatedAt: now };
    const journal = [...get().journal, entry];
    set({ journal }); save(KEYS.JOURNAL, journal);
  },
  updateJournalEntry: (id, updates) => {
    const journal = get().journal.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    set({ journal }); save(KEYS.JOURNAL, journal);
  },
  deleteJournalEntry: (id) => {
    const journal = get().journal.filter(e => e.id !== id);
    set({ journal }); save(KEYS.JOURNAL, journal);
  },

  decks: load(KEYS.DECKS, []),
  activeDeckId: load(KEYS.ACTIVE_DECK, null),
  addDeck: (d) => {
    const now = new Date().toISOString();
    const deck = { ...d, id: generateId(), createdAt: now, updatedAt: now };
    const decks = [...get().decks, deck];
    set({ decks }); save(KEYS.DECKS, decks);
  },
  updateDeck: (id, updates) => {
    const decks = get().decks.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    set({ decks }); save(KEYS.DECKS, decks);
  },
  deleteDeck: (id) => {
    const decks = get().decks.filter(d => d.id !== id);
    set({ decks }); save(KEYS.DECKS, decks);
  },
  setActiveDeck: (id) => { set({ activeDeckId: id }); save(KEYS.ACTIVE_DECK, id); },

  settings: load(KEYS.SETTINGS, DEFAULT_SETTINGS),
  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings }); save(KEYS.SETTINGS, settings);
  },
}));