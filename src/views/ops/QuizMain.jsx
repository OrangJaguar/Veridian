export function QuizMain() {
  return (
    <main id="quizView" className="hidden">
      <div className="module-header">
        <div className="progress-container">
          <span id="quizProgressText" className="progress-text">
            Q 1/5
          </span>
          <div className="progress-bar">
            <div id="quizProgressFill" className="progress-fill" />
          </div>
        </div>

        <div className="tool-suite">
          <button type="button" className="util-btn exit-btn exitToMenuBtn" title="Exit to Menu">
            Exit
          </button>
          <div className="timer-suite">
            <span id="timerDisplay" className="time-display">
              00:00
            </span>
            <button id="pauseBtn" type="button" className="util-btn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
            <button id="hideTimerBtn" type="button" className="util-btn">
              Hide
            </button>
          </div>
        </div>
      </div>

      <div id="questionContainer" className="question-block">
        <div id="questionText" className="question-text">
          Loading question...
        </div>
        <div id="optionsGrid" className="options-grid" />
        <div id="feedbackText" className="feedback-text" />
      </div>

      <div id="pausedContainer" className="paused-mask hidden">
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Timer Paused</h2>
        <p>Question content is hidden.</p>
        <button id="resumeBtn" type="button" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Resume Assessment
        </button>
      </div>

      <div className="action-row">
        <div id="skipContainer">
          <button id="skipBtn" type="button" className="btn">
            Skip Question
          </button>
          <span className="keyboard-hint" style={{ marginLeft: '1rem' }}>
            Press &apos;S&apos; to skip
          </span>
        </div>
        <div>
          <span className="keyboard-hint" style={{ marginRight: '1rem' }}>
            Press &apos;Space&apos; to advance
          </span>
          <button id="nextBtn" type="button" className="btn btn-primary" disabled>
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
