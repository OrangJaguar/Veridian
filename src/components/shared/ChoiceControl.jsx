export function ChoiceRadio({ name, value, checked, onChange, label, className = '' }) {
  return (
    <label className={`choice-control choice-radio ${className}`.trim()}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="choice-control-input"
      />
      <span className="choice-control-box" aria-hidden />
      <span className="choice-control-label">{label}</span>
    </label>
  );
}

export function ChoiceToggle({ checked, onChange, label, description }) {
  return (
    <label className="choice-control choice-toggle">
      <span className="choice-toggle-text">
        <span className="choice-control-label">{label}</span>
        {description && <span className="choice-toggle-desc">{description}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="choice-control-input"
      />
      <span className="choice-toggle-track" aria-hidden>
        <span className="choice-toggle-thumb" />
      </span>
    </label>
  );
}

export function ChoicePresetButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      className={`choice-preset-btn${selected ? ' selected' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
