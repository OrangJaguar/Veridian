export const STORAGE_KEYS = {
  TASKS: 'axiom_tasks',
  JOURNAL: 'axiom_journal',
  DECKS: 'axiom_decks',
  POMODORO_SESSIONS: 'axiom_pomodoro_sessions',
  TYPING_RESULTS: 'axiom_typing_results',
  EDITOR_NOTES: 'axiom_editor_notes',
  SCHEDULE_BLOCKS: 'axiom_schedule_blocks',
  GOALS: 'axiom_goals',
  MASTERY: 'axiom_mastery',
  SETTINGS: 'axiom_settings',
  ACTIVE_DECK: 'axiom_active_deck',
  APP_MODE: 'axiom_app_mode',
  OPS_VIEW: 'axiom_ops_view',
};

export const DEFAULT_FOCUS_SETTINGS = {
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
};

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: '#6366f1',
  fontSize: 'md',
  focusSettings: DEFAULT_FOCUS_SETTINGS,
  notifications: true,
  soundEnabled: true,
};

export const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const MOOD_EMOJI = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '😕',
  terrible: '😞',
};

export const DECK_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f59e0b', '#22c55e', '#06b6d4', '#3b82f6',
];