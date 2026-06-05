// localStorage keys and static defaults

export const PREFS_KEY = 'veridian_preferences';
export const DECKS_KEY = 'veridian_decks';
export const TELEMETRY_KEY = 'veridian_telemetry';

const LEGACY_KEY_MAP = [
  ['axiom_preferences', PREFS_KEY],
  ['axiom_decks', DECKS_KEY],
  ['axiom_telemetry', TELEMETRY_KEY],
];

export function migrateLegacyStorageKeys() {
  LEGACY_KEY_MAP.forEach(([oldKey, newKey]) => {
    if (!localStorage.getItem(newKey) && localStorage.getItem(oldKey)) {
      localStorage.setItem(newKey, localStorage.getItem(oldKey));
      localStorage.removeItem(oldKey);
    }
  });
}
