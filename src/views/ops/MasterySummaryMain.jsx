export function MasterySummaryMain() {
  return (
    <main id="masterySummaryView" className="hidden">
      <div className="summary-stats">
        <div className="stat-box">
          <span id="masteryCount" className="stat-value">
            0/0
          </span>
          <span className="stat-label">Mastered</span>
        </div>
        <div className="stat-box">
          <span id="masteryTime" className="stat-value">
            00:00
          </span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>
      <div id="masteryReviewContainer" className="review-list" />
      <div className="action-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <button id="masteryExportBtn" type="button" className="btn">
            Copy Results
          </button>
          <span
            id="masteryExportFeedback"
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
          <button id="masteryRetryBtn" type="button" className="btn btn-primary">
            Redo Deck
          </button>
        </div>
      </div>
    </main>
  );
}
