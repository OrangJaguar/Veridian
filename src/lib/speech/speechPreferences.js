const STORAGE_KEY = 'veridian-speech-prefs';

const DEFAULTS = {
  rate: 0.96,
  voiceURI: '',
};

export function readSpeechPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      rate: typeof parsed.rate === 'number' ? parsed.rate : DEFAULTS.rate,
      voiceURI: typeof parsed.voiceURI === 'string' ? parsed.voiceURI : DEFAULTS.voiceURI,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSpeechPreferences(prefs) {
  const next = {
    rate: typeof prefs.rate === 'number' ? prefs.rate : DEFAULTS.rate,
    voiceURI: typeof prefs.voiceURI === 'string' ? prefs.voiceURI : DEFAULTS.voiceURI,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
