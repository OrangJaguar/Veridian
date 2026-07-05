export default function BaselineDravianGraphic() {
  return (
    <div className="baseline-dravian-graphic" aria-hidden="true">
      <div className="baseline-dravian-branch baseline-dravian-branch--water">
        <div className="baseline-dravian-icon baseline-dravian-icon--water">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3c-3.5 4.5-6 7.8-6 11a6 6 0 0 0 12 0c0-3.2-2.5-6.5-6-11Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="baseline-dravian-branch-copy">
          <strong>Water scarce</strong>
          <span>Decentralize</span>
          <span>Power → local farmers</span>
        </div>
      </div>

      <div className="baseline-dravian-divider" aria-hidden="true">
        <span />
        <small>vs</small>
        <span />
      </div>

      <div className="baseline-dravian-branch baseline-dravian-branch--metal">
        <div className="baseline-dravian-icon baseline-dravian-icon--metal">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="baseline-metal-shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f0f2f5" />
                <stop offset="42%" stopColor="#9aa3ad" />
                <stop offset="100%" stopColor="#d8dde3" />
              </linearGradient>
            </defs>
            <path
              d="M6 17h12l-1.5 4H7.5L6 17Z"
              fill="url(#baseline-metal-shine)"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M8 17 10 6h4l2 11"
              fill="url(#baseline-metal-shine)"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path
              d="M9.5 10h5"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="baseline-dravian-branch-copy">
          <strong>Metal scarce</strong>
          <span>Centralize</span>
          <span>Power → armed forces</span>
        </div>
      </div>
    </div>
  );
}
