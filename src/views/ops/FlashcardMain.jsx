export function FlashcardMain() {
  return (
    <main id="flashcardView" className="hidden">
      <div className="module-header">
        <div className="progress-container">
          <span id="fcProgressText" className="progress-text">
            Card 1/5
          </span>
          <div className="progress-bar">
            <div id="fcProgressFill" className="progress-fill" />
          </div>
        </div>
        <button type="button" className="util-btn exit-btn exitToMenuBtn">
          Exit
        </button>
      </div>

      <div className="card-scene">
        <div id="flashcardObject" className="card-object">
          <div className="card-face card-face-front">
            <span className="card-label">Front</span>
            <div id="fcFrontContent" className="card-content" />
          </div>
          <div className="card-face card-face-back">
            <span className="card-label">Back</span>
            <div id="fcBackContent" className="card-content" />
          </div>
        </div>
      </div>

      <div id="fcFrontActions" className="action-row" style={{ justifyContent: 'center' }}>
        <span className="keyboard-hint" style={{ position: 'absolute', left: 0 }}>
          Spacebar to flip
        </span>
        <button id="fcShowAnswerBtn" type="button" className="btn btn-primary">
          Show Answer
        </button>
      </div>

      <div id="fcBackActions" className="action-row hidden" style={{ justifyContent: 'center', gap: '1rem', width: '100%' }}>
        <button type="button" className="btn srs-btn again" data-rate="again">
          <span>Again</span>
          <span className="key">Press 1</span>
        </button>
        <button type="button" className="btn srs-btn hard" data-rate="hard">
          <span>Hard</span>
          <span className="key">Press 2</span>
        </button>
        <button type="button" className="btn srs-btn good" data-rate="good">
          <span>Good</span>
          <span className="key">Press 3</span>
        </button>
        <button type="button" className="btn srs-btn easy" data-rate="easy">
          <span>Easy</span>
          <span className="key">Press 4</span>
        </button>
      </div>
    </main>
  );
}
