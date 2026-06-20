import { useState, useEffect, useRef } from 'react';
import { Volume2, Pause, Play, Settings2 } from 'lucide-react';
import { useSpeechVoices } from '@/hooks/study/useSpeechVoices';
import { readSpeechPreferences, writeSpeechPreferences } from '@/lib/speech/speechPreferences';

export default function GuideNarrationControls({
  status,
  disabled,
  onPlayPause,
  onStop,
  prefs,
  onPrefsChange,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelRef = useRef(null);
  const voices = useSpeechVoices();

  const englishVoices = voices.filter((v) => v.lang?.startsWith('en'));
  const voiceOptions = englishVoices.length ? englishVoices : voices;

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [settingsOpen]);

  const handleRateChange = (e) => {
    const rate = Number(e.target.value);
    const next = writeSpeechPreferences({ ...prefs, rate });
    onPrefsChange(next);
  };

  const handleVoiceChange = (e) => {
    const voiceURI = e.target.value;
    const next = writeSpeechPreferences({ ...prefs, voiceURI });
    onPrefsChange(next);
  };

  const isActive = status === 'speaking' || status === 'paused';

  return (
    <div className="guide-narration-controls" ref={panelRef}>
      <button
        type="button"
        className={`guide-listen-btn${isActive ? ' active' : ''}`}
        onClick={onPlayPause}
        disabled={disabled}
        aria-label={
          status === 'speaking' ? 'Pause narration'
            : status === 'paused' ? 'Resume narration'
              : 'Read this section aloud'
        }
      >
        {status === 'speaking' ? (
          <Pause size={16} fill="currentColor" />
        ) : status === 'paused' ? (
          <Play size={16} fill="currentColor" />
        ) : (
          <Volume2 size={16} />
        )}
      </button>

      <button
        type="button"
        className={`guide-listen-btn guide-narration-settings-btn${settingsOpen ? ' active' : ''}`}
        onClick={() => setSettingsOpen((o) => !o)}
        aria-label="Narration settings"
        aria-expanded={settingsOpen}
      >
        <Settings2 size={15} />
      </button>

      {settingsOpen && (
        <div className="guide-narration-settings-panel">
          <label className="guide-narration-settings-field">
            <span>Speed</span>
            <div className="guide-narration-settings-rate">
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={prefs.rate}
                onChange={handleRateChange}
              />
              <span>{prefs.rate.toFixed(2)}×</span>
            </div>
          </label>
          <label className="guide-narration-settings-field">
            <span>Voice</span>
            <select value={prefs.voiceURI} onChange={handleVoiceChange}>
              <option value="">System default</option>
              {voiceOptions.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </label>
          {isActive && (
            <button type="button" className="btn btn-secondary btn-sm guide-narration-stop-btn" onClick={onStop}>
              Stop narration
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function useGuideSpeechPrefs() {
  const [prefs, setPrefs] = useState(() => readSpeechPreferences());
  return [prefs, setPrefs];
}
