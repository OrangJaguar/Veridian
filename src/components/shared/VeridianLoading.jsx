/**
 * Branded loading indicator — clean white V with a gentle opacity pulse.
 */
export default function VeridianLoading({
  fullPage = false,
  size = 'md',
  label = null,
  className = '',
}) {
  const V_SHAPE =
    'M 11 13 L 28 47 L 45 13 L 37.5 13 L 28 31.5 L 18.5 13 Z';

  const sizeClass = size === 'sm' ? 'veridian-loading--sm' : size === 'lg' ? 'veridian-loading--lg' : '';

  const svg = (
    <svg
      className={`veridian-loading-mark ${sizeClass}`}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path className="veridian-loading-v" d={V_SHAPE} />
    </svg>
  );

  const content = (
    <div className={`veridian-loading ${sizeClass} ${className}`.trim()} role="status" aria-live="polite">
      {svg}
      {label && <p className="veridian-loading-label">{label}</p>}
      {!label && <span className="sr-only">Loading</span>}
    </div>
  );

  if (fullPage) {
    return <div className="veridian-loading-page">{content}</div>;
  }

  return content;
}
