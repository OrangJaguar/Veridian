import { useState } from 'react';

const MODES = [
  {
    id: 'quiz',
    name: 'Quiz',
    tagline: 'Test recall',
    description: 'Multiple-choice and short-answer from your material. See what you actually know.',
    preview: (
      <div className="landing-mode-live quiz">
        <p className="landing-mode-live-q">What is the rate-determining step in SN2?</p>
        <button type="button" className="landing-mode-live-opt selected">Backside nucleophilic attack</button>
        <button type="button" className="landing-mode-live-opt">Carbocation rearrangement</button>
        <button type="button" className="landing-mode-live-opt">Elimination first</button>
      </div>
    ),
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    tagline: 'Flip & repeat',
    description: 'Front/back cards on a spaced repetition schedule — definitions, formulas, facts.',
    preview: (
      <div className="landing-mode-live flashcards">
        <div className="landing-mode-live-flip">
          <span className="landing-mode-live-flip-label">Front</span>
          <strong>Mitochondria</strong>
          <span className="landing-mode-live-flip-hint">Click to flip →</span>
        </div>
      </div>
    ),
  },
  {
    id: 'typing',
    name: 'Typing',
    tagline: 'Free recall',
    description: 'Type the answer from memory. No hints — builds exam-style recall.',
    preview: (
      <div className="landing-mode-live typing">
        <p className="landing-mode-live-q">Define osmosis:</p>
        <div className="landing-mode-live-typefield">
          water moves across a semipermeable membrane<span className="landing-mode-live-cursor">|</span>
        </div>
      </div>
    ),
  },
  {
    id: 'summary',
    name: 'Summary',
    tagline: 'Big picture',
    description: 'Session recap with accuracy, time, and key takeaways before you move on.',
    preview: (
      <div className="landing-mode-live summary">
        <div className="landing-mode-live-stats">
          <span><strong>87%</strong> accuracy</span>
          <span><strong>24m</strong> engaged</span>
        </div>
        <div className="landing-mode-live-summary">
          <div className="landing-mode-live-bar" />
          <div className="landing-mode-live-bar" />
          <div className="landing-mode-live-bar short" />
        </div>
      </div>
    ),
  },
];

export default function LandingInteractiveModes() {
  const [active, setActive] = useState('quiz');
  const mode = MODES.find((m) => m.id === active) ?? MODES[0];

  return (
    <div className="landing-interactive-modes">
      <div className="landing-mode-picker" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active === m.id}
            className={`landing-mode-pick${active === m.id ? ' active' : ''}`}
            onClick={() => setActive(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      <div className="landing-mode-showcase" role="tabpanel">
        <div className="landing-mode-showcase-copy">
          <span className="landing-mode-showcase-tag">{mode.tagline}</span>
          <h3>{mode.name}</h3>
          <p>{mode.description}</p>
        </div>
        <div key={mode.id} className="landing-mode-showcase-preview">
          {mode.preview}
        </div>
      </div>
    </div>
  );
}
