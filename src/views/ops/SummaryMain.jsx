export function SummaryMain() {
  return (
    <main id="summaryView" className="hidden">
      <div className="summary-stats">
        <div className="stat-box">
          <span id="finalScore" className="stat-value">
            0%
          </span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="stat-box">
          <span id="finalTime" className="stat-value">
            00:00
          </span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>

      <div id="reviewContainer" className="review-list" />

      <div className="action-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <button id="exportBtn" type="button" className="btn">
            Copy Results
          </button>
          <span
            id="exportFeedback"
            style={{ fontSize: '0.875rem', color: 'var(--correct-border)', marginLeft: '0.5rem' }}
            className="hidden"
          >
            Copied!
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="button" className="btn exitToMenuBtn">
            Back to Dashboard
          </button>
          <button id="retryBtn" type="button" className="btn btn-primary">
            Retry Assessment
          </button>
        </div>
      </div>
    </main>
  );
}
