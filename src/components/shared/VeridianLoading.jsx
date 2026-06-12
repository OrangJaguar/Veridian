import { useId } from 'react';

/** Closed V silhouette — shape stays constant; only the highlight moves. */
const V_SHAPE =
  'M 11 13 L 28 47 L 45 13 L 37.5 13 L 28 31.5 L 18.5 13 Z';

/**
 * Branded loading indicator — fluid highlight sweeps through a fixed V shape.
 */
export default function VeridianLoading({
  fullPage = false,
  size = 'md',
  label = null,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const gradId = `veridian-fluid-${uid}`;

  const sizeClass = size === 'sm' ? 'veridian-loading--sm' : size === 'lg' ? 'veridian-loading--lg' : '';

  const svg = (
    <svg
      className={`veridian-loading-mark ${sizeClass}`}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="28" y1="8" x2="28" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.35" />
          <stop offset="0%" stopColor="var(--text-main)" stopOpacity="0.95">
            <animate
              attributeName="offset"
              values="-0.35;0.15;0.55;1.05;-0.35"
              dur="2.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.25;0.5;0.75;1"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
            />
          </stop>
          <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.35">
            <animate
              attributeName="offset"
              values="-0.15;0.35;0.75;1.25;-0.15"
              dur="2.4s"
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes="0;0.25;0.5;0.75;1"
              keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"
            />
          </stop>
          <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <path className="veridian-loading-v-base" d={V_SHAPE} />
      <path className="veridian-loading-v-shine" d={V_SHAPE} fill={`url(#${gradId})`} />
      <path className="veridian-loading-v-stroke" d="M 11 13 L 28 47 L 45 13" />
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
