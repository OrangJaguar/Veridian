import { useState } from 'react';
import { ArrowUp, Flag, Lightbulb, Mic, Pause } from 'lucide-react';

export function LandingActivityPreviewFrame({ children }) {
  return (
    <div className="landing-activity-preview-shell">
      <div className="landing-activity-preview-frame">{children}</div>
    </div>
  );
}

export function LandingGuidePreview() {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleCheck = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
  };

  return (
    <div className="study-mode-view guide-mode-view landing-preview-activity">
      <header className="guide-header">
        <button type="button" className="util-btn exit-btn" tabIndex={-1}>Exit</button>
        <div className="guide-header-center">
          <span className="guide-progress-pct">38%</span>
          <div className="progress-bar guide-progress-bar">
            <div className="progress-fill" style={{ width: '38%' }} />
          </div>
          <button type="button" className="guide-section-picker-trigger" tabIndex={-1}>
            Section 2 of 4
          </button>
        </div>
      </header>
      <main className="guide-scroll">
        <h1 className="guide-title">Transcription basics</h1>
        <div className="guide-zigzag">
          <div className="guide-zigzag-row">
            <div className="guide-zigzag-text">
              <p className="guide-sentence">
                RNA polymerase binds the promoter and unwinds the template strand. It reads
                the template 3′→5′ to build mRNA in the 5′→3′ direction. As it moves along
                the gene, the enzyme adds complementary RNA nucleotides one at a time. A
                phosphodiester bond forms between each new nucleotide and the growing chain.
                Transcription ends when RNA polymerase reaches a termination signal downstream
                of the gene. The freshly made pre-mRNA is then processed — capped, spliced,
                and given a poly-A tail — before it leaves the nucleus. These modifications
                protect the transcript and help ribosomes recognize where translation should
                start.
              </p>
            </div>
            <div className="guide-zigzag-aside">
              <aside className="guide-side-panel guide-side-panel--terms">
                <h2 className="guide-side-panel-title">Key terms</h2>
                <dl className="guide-side-panel-terms">
                  <div className="guide-side-panel-term">
                    <dt>Promoter</dt>
                    <dd>DNA region where RNA polymerase binds to start transcription</dd>
                  </div>
                  <div className="guide-side-panel-term">
                    <dt>Template strand</dt>
                    <dd>The strand copied into mRNA — complementary to the final transcript</dd>
                  </div>
                  <div className="guide-side-panel-term">
                    <dt>RNA polymerase</dt>
                    <dd>Enzyme that adds RNA nucleotides using the template as a guide</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </div>
          <div className="guide-zigzag-row guide-zigzag-row--flip">
            <div className="guide-zigzag-aside">
              <aside className="guide-side-panel guide-side-panel--takeaways">
                <h2 className="guide-side-panel-title">Remember</h2>
                <ul className="guide-side-panel-list">
                  <li>Transcription happens in the nucleus (eukaryotes)</li>
                  <li>mRNA matches the coding strand — T becomes U</li>
                  <li>Only one DNA strand is copied per gene</li>
                </ul>
              </aside>
            </div>
            <div className="guide-zigzag-text">
              <p className="guide-sentence">
                Only the template strand gets copied into mRNA. The coding strand has the same
                sequence as mRNA, except thymine is replaced by uracil. Knowing which strand
                is which is what lets you predict the transcript before translation begins.
                Mix them up and every downstream answer — from codons to amino acids — will
                be wrong.
              </p>
            </div>
          </div>
        </div>
        <section className="guide-example-card">
          <span className="guide-example-label">Worked example — let&apos;s solve it together</span>
          <p className="guide-example-intro">
            We&apos;ll break this down step by step. Follow each part before moving on.
          </p>
          <div className="guide-example-problem">
            <span className="guide-example-problem-label">The problem</span>
            <p className="guide-example-scenario">
              Given coding strand 5′-ATGC-3′, what is the mRNA transcript?
            </p>
          </div>
          <ol className="guide-example-steps">
            <li>
              <span className="guide-example-step-num">Step 1</span>
              mRNA uses the same sequence as the coding strand, replacing T with U.
            </li>
            <li>
              <span className="guide-example-step-num">Step 2</span>
              Apply T→U to ATGC → the transcript is AUGC.
            </li>
          </ol>
          <div className="guide-example-takeaway">
            <span className="guide-example-takeaway-label">What we found</span>
            <p>5′-AUGC-3′</p>
          </div>
          <p className="guide-example-reasoning">
            <strong>Why this works: </strong>
            The coding strand matches mRNA except thymine becomes uracil — that&apos;s the
            sequence ribosomes actually read during translation.
          </p>
        </section>
        <section className="guide-checkin">
          <div className="guide-checkin-header">
            <span className="guide-checkin-badge">Quick check-in</span>
            <h3 className="guide-checkin-question">Which enzyme adds RNA nucleotides?</h3>
          </div>
          <div className="guide-checkin-options">
            {['DNA polymerase', 'RNA polymerase', 'Helicase'].map((opt) => {
              let state = '';
              if (revealed && opt === 'RNA polymerase') state = ' correct';
              else if (revealed && opt === selected) state = ' wrong';
              return (
                <button
                  key={opt}
                  type="button"
                  className={`guide-checkin-option${state}`}
                  disabled={revealed}
                  onClick={() => handleCheck(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export function LandingQuizPreview() {
  const [selected, setSelected] = useState(null);
  const [flagged, setFlagged] = useState(false);
  const options = ['Cytoplasm', 'Nucleus', 'Ribosome', 'Golgi apparatus'];
  const correct = 'Nucleus';

  return (
    <div className="study-mode-view quiz-mode-view landing-preview-activity">
      <div className="module-header">
        <div className="progress-container">
          <span className="progress-text">25%</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '25%' }} />
          </div>
        </div>
        <div className="tool-suite">
          <button type="button" className="util-btn exit-btn" tabIndex={-1}>Exit</button>
          <button
            type="button"
            className={`quiz-flag-btn${flagged ? ' active' : ''}`}
            onClick={() => setFlagged(!flagged)}
            aria-label="Flag question"
          >
            <Flag size={14} />
          </button>
          <span className="time-display">1:24</span>
        </div>
      </div>
      <div className="question-block">
        <p className="question-text">Where does transcription occur in eukaryotes?</p>
        <div className="options-grid">
          {options.map((opt, i) => (
            <button
              key={opt}
              type="button"
              className={`option-btn${selected === opt ? ' selected' : ''}`}
              onClick={() => setSelected(opt)}
            >
              <span className="option-key">{i + 1}</span>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LandingFlashcardPreview() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="study-mode-view flashcard-mode-view landing-preview-activity landing-preview-activity--flashcard">
      <div className="module-header">
        <span className="progress-text">8 remaining</span>
        <button type="button" className="util-btn exit-btn" tabIndex={-1}>Exit</button>
      </div>
      <div className="card-scene">
        <div
          className={`card-object${flipped ? ' is-flipped' : ''}`}
          onClick={() => setFlipped(!flipped)}
          onKeyDown={(e) => e.key === ' ' && setFlipped(!flipped)}
          role="button"
          tabIndex={0}
        >
          <div className="card-face card-face-front">
            <span className="card-label">Front</span>
            <div className="card-content">What is the function of mitochondria?</div>
          </div>
          <div className="card-face card-face-back">
            <span className="card-label">Back</span>
            <div className="card-content">ATP production through cellular respiration</div>
          </div>
        </div>
      </div>
      {!flipped ? (
        <div className="action-row flashcard-front-actions">
          <button type="button" className="btn btn-primary" onClick={() => setFlipped(true)}>
            Show Answer
          </button>
        </div>
      ) : (
        <div className="action-row flashcard-back-actions">
          {['again', 'hard', 'good', 'easy'].map((r) => (
            <button key={r} type="button" className={`btn srs-btn ${r}`} onClick={() => setFlipped(false)}>
              <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LandingFeynmanPreview() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Let's talk about photosynthesis. Explain the concept in your own words." },
  ]);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'ai', text: 'What happens to the energy from sunlight in that process?' },
    ]);
    setDraft('');
  };

  return (
    <div className="feynman-mode-view landing-preview-activity landing-preview-activity--feynman">
      <div className="feynman-chat-scroll">
        <div className="feynman-chat-messages">
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`feynman-bubble-row feynman-bubble-row--${msg.role === 'ai' ? 'ai' : 'user'}`}
            >
              <div className={`feynman-bubble feynman-bubble--${msg.role === 'ai' ? 'ai' : 'user'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="feynman-chat-input-wrap">
        <div className="feynman-chat-input-bar">
          <button type="button" className="feynman-mic-btn" tabIndex={-1} aria-label="Voice input">
            <Mic size={14} />
          </button>
          <textarea
            className="feynman-chat-textarea"
            rows={1}
            placeholder="Explain it in your own words…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            className="feynman-send-btn"
            onClick={handleSend}
            disabled={!draft.trim()}
            aria-label="Send"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function LandingFreeRecallPreview() {
  const [text, setText] = useState('');

  return (
    <div className="study-mode-view free-recall-mode-view landing-preview-activity landing-preview-activity--recall">
      <h1 className="free-recall-title">
        Write everything you remember about <span>gene expression</span>
      </h1>
      <div className="free-recall-toolbar">
        <button type="button" className="free-recall-tool-btn" tabIndex={-1}>
          <Lightbulb size={13} /> Hint <span className="free-recall-hint-badge">1/3</span>
        </button>
        <span className="time-display">2:14</span>
      </div>
      <div className="free-recall-editor-wrap">
        <textarea
          className="free-recall-textarea"
          placeholder="Start writing…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  );
}
