/** Solid pennant flag — filled when active, outlined when not. */
export function ApFlagIcon({ filled = false, className = '' }) {
  return (
    <svg
      className={`ap-classroom-flag-icon${filled ? ' filled' : ''}${className ? ` ${className}` : ''}`}
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M3 2v12M3 2h9.2L10 5.2l2.2 3.2H3"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ABC with diagonal strikethrough for crossout mode toggle. */
export function ApAbcCrossoutIcon({ className = '' }) {
  return (
    <svg
      className={`ap-classroom-abc-icon${className ? ` ${className}` : ''}`}
      viewBox="0 0 40 18"
      aria-hidden="true"
    >
      <text x="0" y="14" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="Inter, system-ui, sans-serif">
        ABC
      </text>
      <line x1="0" y1="9" x2="38" y2="3" stroke="#C13145" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

/** Corner bookmark for flagged grid cells. */
export function ApGridFlagIcon() {
  return (
    <span className="ap-classroom-grid-flag-corner" aria-hidden="true">
      <svg viewBox="0 0 12 14" className="ap-classroom-grid-flag-svg">
        <path d="M10 0H2v14l5-3.5L12 14V0z" fill="#C13145" />
      </svg>
    </span>
  );
}
