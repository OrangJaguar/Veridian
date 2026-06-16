export default function VeridianSlider({
  id,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  className = '',
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div
      className={`veridian-slider${className ? ` ${className}` : ''}`}
      style={{ '--slider-pct': `${pct}%` }}
    >
      <input
        id={id}
        type="range"
        className="veridian-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
