export function TypingMain() {
  return (
    <main id="typingView" className="hidden">
      <div className="module-header">
        <div className="progress-container">
          <span id="typingProgressText" className="progress-text">
            Prompt 1/1
          </span>
          <div className="progress-bar">
            <div id="typingProgressFill" className="progress-fill" />
          </div>
        </div>
        <button type="button" className="util-btn exit-btn exitToMenuBtn">
          Exit
        </button>
      </div>
      <div className="preview-item" style={{ marginTop: '0.5rem' }}>
        <div className="preview-q" id="typingFrontPrompt" />
        <div
          id="typingMaskedAnswer"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            color: 'var(--text-main)',
            lineHeight: 1.7,
          }}
        />
      </div>
      <div className="action-row typing-input-row">
        <input id="typingAnswerInput" type="text" placeholder="Type the missing word/phrase..." />
        <button id="typingSubmitBtn" type="button" className="btn btn-primary">
          Check
        </button>
        <button id="typingGiveUpBtn" type="button" className="btn btn-subtle">
          Give Up
        </button>
        <button id="typingNextBtn" type="button" className="btn hidden">
          Next
        </button>
        <span id="typingSpaceHint" className="keyboard-hint hidden">
          Press &apos;Space&apos; to advance
        </span>
      </div>
      <div id="typingFeedback" className="feedback-text" />
    </main>
  );
}
