export default function VeridianRadio({
  checked,
  onChange,
  disabled,
  name,
  value,
  id,
  children,
  className = '',
}) {
  return (
    <label className={`veridian-radio${className ? ` ${className}` : ''}`}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        className="veridian-native-input"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="veridian-radio-circle" aria-hidden="true" />
      {children != null && <span className="veridian-radio-label">{children}</span>}
    </label>
  );
}
