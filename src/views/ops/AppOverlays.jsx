export function PromptAndPreviewModals() {
  return (
    <>
      <div id="promptModal" className="modal-overlay hidden">
        <div className="modal-content">
          <div className="modal-header">
            <h2>LLM Injection Prompt</h2>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => document.getElementById('promptModal')?.classList.add('hidden')}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <p>
              Veridian utilizes a strict heuristic parser. To generate decks instantly using ChatGPT or Claude, append this
              exact system prompt to your request.
            </p>

            <div className="prompt-box">
              <button id="copyPromptBtn" type="button" className="copy-btn">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <span id="promptText">
                Generate a comprehensive study deck about the requested topic. You MUST format the output EXACTLY
                according to these rules: 1. Separate each flashcard/question block with exactly one blank line. 2. For
                standard Q&amp;A (Flashcards): Line 1 is the Front/Term, Line 2 is the Back/Definition. 3. For Multiple
                Choice: Line 1 is the question. The following lines are options. Prefix the correct option with an
                asterisk (*). Prefix wrong options/distractors with a hyphen (-). Provide ONLY the raw formatted text. Do
                not include markdown code fences or conversational filler.
              </span>
            </div>
            <div
              id="promptCopyFeedback"
              className="hidden"
              style={{ color: 'var(--correct-border)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'right' }}
            >
              Copied to clipboard!
            </div>
          </div>
        </div>
      </div>

      <div id="previewModal" className="modal-overlay hidden">
        <div className="modal-content" style={{ maxWidth: '800px', height: '80vh' }}>
          <div className="modal-header">
            <h2>Deck Preview</h2>
            <button
              type="button"
              className="close-modal-btn"
              onClick={() => document.getElementById('previewModal')?.classList.add('hidden')}
            >
              ×
            </button>
          </div>
          <div className="modal-body" id="previewContainer" />
        </div>
      </div>
    </>
  );
}

export function SettingsModals() {
  return (
    <div id="settingsCenterModal" className="modal-overlay hidden">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="close-modal-btn"
            onClick={() => document.getElementById('settingsCenterModal')?.classList.add('hidden')}
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
            <span>Dark Mode</span>
            <label className="switch-toggle">
              <input type="checkbox" id="themeToggle" defaultChecked />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
            <span>Haptic Feedback</span>
            <label className="switch-toggle">
              <input type="checkbox" id="hapticToggle" defaultChecked />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-row" style={{ marginBottom: '0.9rem' }}>
            <span>Audio Effects</span>
            <label className="switch-toggle">
              <input type="checkbox" id="audioToggle" defaultChecked />
              <span className="slider" />
            </label>
          </div>
          <div className="settings-row">
            <span>Strict Quiz Mode</span>
            <label className="switch-toggle">
              <input type="checkbox" id="strictModeToggle" />
              <span className="slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
