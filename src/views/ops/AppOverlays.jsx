import React from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { ACCENT_PRESETS, FONT_SIZE_OPTIONS, applyAllSettings } from '../../lib/modals/settings-ui';

export default function AppOverlays({ showSettings, onCloseSettings }) {
  const { settings, updateSettings } = useAxiomStore();

  if (!showSettings) return null;

  const handleAccent = (color) => {
    const next = { ...settings, accentColor: color };
    updateSettings(next);
    applyAllSettings(next);
  };

  const handleFontSize = (size) => {
    const next = { ...settings, fontSize: size };
    updateSettings(next);
    applyAllSettings(next);
  };

  const handleTheme = (theme) => {
    const next = { ...settings, theme };
    updateSettings(next);
    applyAllSettings(next);
  };

  return (
    <div className="axiom-overlay-backdrop" onClick={onCloseSettings}>
      <div className="axiom-settings-panel" onClick={e => e.stopPropagation()}>
        <div className="axiom-settings-header">
          <h2>Settings</h2>
          <button onClick={onCloseSettings}>✕</button>
        </div>

        <section className="axiom-settings-section">
          <h3>Theme</h3>
          <div className="axiom-settings-row">
            {['dark', 'light'].map(t => (
              <button key={t} className={`axiom-theme-btn ${settings.theme === t ? 'active' : ''}`} onClick={() => handleTheme(t)}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </section>

        <section className="axiom-settings-section">
          <h3>Accent Color</h3>
          <div className="axiom-accent-grid">
            {ACCENT_PRESETS.map(p => (
              <button key={p.value} className={`axiom-accent-swatch ${settings.accentColor === p.value ? 'active' : ''}`}
                style={{ background: p.value }} title={p.name} onClick={() => handleAccent(p.value)} />
            ))}
          </div>
        </section>

        <section className="axiom-settings-section">
          <h3>Font Size</h3>
          <div className="axiom-settings-row">
            {FONT_SIZE_OPTIONS.map(f => (
              <button key={f.value} className={`axiom-font-btn ${settings.fontSize === f.value ? 'active' : ''}`} onClick={() => handleFontSize(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </section>

        <section className="axiom-settings-section">
          <h3>Focus Settings</h3>
          <div className="axiom-settings-grid">
            {[
              { label: 'Work (min)', key: 'workDuration' },
              { label: 'Short Break', key: 'shortBreak' },
              { label: 'Long Break', key: 'longBreak' },
            ].map(({ label, key }) => (
              <label key={key} className="axiom-settings-label">
                {label}
                <input type="number" min={1} max={120} value={settings.focusSettings[key]}
                  onChange={e => updateSettings({ focusSettings: { ...settings.focusSettings, [key]: Number(e.target.value) } })}
                  className="axiom-input" />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}