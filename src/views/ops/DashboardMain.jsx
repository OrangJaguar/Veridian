/** OPS dashboard + telemetry (legacy ids preserved for engine). */
export function DashboardMain() {
  return (
    <main id="dashboardView" className="">
      <div>
        <div className="telemetry-heading-row">
          <h2 className="text-[1.1rem] text-text-main font-sans">Global Telemetry</h2>
          <div className="telemetry-controls">
            <select id="telemetryRangePreset">
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="year">Year</option>
              <option value="custom">Custom Range</option>
            </select>
            <div id="telemetryCustomRange" className="telemetry-custom-range hidden">
              <input id="telemetryStartDate" type="date" />
              <input id="telemetryEndDate" type="date" />
            </div>
          </div>
        </div>
        <div className="telemetry-board">
          <div className="tel-metric">
            <span id="telTotalTime" className="tel-val">
              0m
            </span>
            <span className="tel-lbl">Time Engaged</span>
          </div>
          <div className="tel-metric">
            <span id="telAccuracy" className="tel-val">
              0%
            </span>
            <span className="tel-lbl">Global Accuracy</span>
          </div>
          <div className="tel-metric">
            <span id="telQuizzes" className="tel-val">
              0
            </span>
            <span className="tel-lbl">Questions Answered</span>
          </div>
          <div className="tel-metric">
            <span id="telCards" className="tel-val">
              0
            </span>
            <span className="tel-lbl">Cards Flipped</span>
          </div>
        </div>
      </div>

      <div>
        <div className="deck-header">
          <h2 className="text-[1.1rem] text-text-main font-sans">Your Library</h2>
          <button id="createNewDeckBtn" type="button" className="btn btn-primary">
            + Create Deck
          </button>
        </div>
        <div id="deckGrid" className="deck-grid" />
      </div>
    </main>
  );
}
