export function EditorMain() {
  return (
    <main id="editorView" className="hidden">
      <div className="editor-header">
        <button id="backToDashBtn" type="button" className="util-btn">
          ← Back
        </button>

        <div className="deck-name-container">
          <input type="text" id="deckTitleInput" className="deck-name-input" placeholder="Untitled Deck" />
          <svg
            className="edit-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button id="viewDeckBtn" type="button" className="btn">
            View Deck
          </button>
          <button id="saveDeckBtn" type="button" className="btn btn-primary">
            Save &amp; Parse
          </button>
        </div>
      </div>

      <div className="setup-instructions">
        <button
          type="button"
          className="help-icon-btn"
          onClick={() => document.getElementById('promptModal')?.classList.remove('hidden')}
        >
          ?
        </button>
        <div className="setup-instructions-rules">
          <h3>Heuristic Parsing Engine</h3>
          <ul>
            <li>
              <strong>Q&amp;A Pairs:</strong> Line 1 = Front, Line 2 = Back.
            </li>
            <li>
              <strong>Multiple Choice:</strong> Correct options <code>*</code>, distractors <code>-</code>.
            </li>
          </ul>
          <label className="file-upload-wrapper">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import CSV
            <input type="file" id="csvFileInput" accept=".csv" />
          </label>
        </div>
        <div className="setup-instructions-example">
          <span style={{ color: 'var(--text-muted)' }}>// Q&amp;A Pair</span>
          <br />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Mitosis</span>
          <br />
          Process of cell duplication.
          <br />
          <br />
          <span style={{ color: 'var(--text-muted)' }}>// Multiple Choice</span>
          <br />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Which year did the Titanic sink?</span>
          <br />
          * 1912
          <br />- 1905
        </div>
      </div>

      <textarea id="dataInput" placeholder="Paste your raw text data or upload a CSV..." />
    </main>
  );
}
