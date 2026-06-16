import { useState } from 'react';

const MODES = [
  {
    id: 'guide',
    name: 'Learning Guide',
    tagline: 'Structured lessons',
    description: 'AI-generated sections with explanations, worked examples, and check-in questions from your material.',
    preview: (
      <div className="landing-mode-live guide">
        <p className="landing-mode-live-section-num">Section 2 of 4</p>
        <h4 className="landing-mode-live-section-title">Transcription basics</h4>
        <p className="landing-mode-live-section-body">
          RNA polymerase binds the promoter region and unwinds the DNA template strand…
        </p>
        <div className="landing-mode-live-checkin">
          <span>Check-in</span>
          <p>Which enzyme adds RNA nucleotides?</p>
        </div>
      </div>
    ),
  },
  {
    id: 'quiz',
    name: 'Practice Quiz',
    tagline: 'Test recall',
    description: 'Multiple-choice and short-answer questions with optional strict timing and review flags.',
    preview: (
      <div className="landing-mode-live quiz">
        <div className="landing-mode-live-quiz-header">
          <span>3/12</span>
          <span className="landing-mode-live-timer">1:24</span>
        </div>
        <p className="landing-mode-live-q">Where does transcription occur in eukaryotes?</p>
        <button type="button" className="landing-mode-live-opt">Cytoplasm</button>
        <button type="button" className="landing-mode-live-opt selected">Nucleus</button>
        <button type="button" className="landing-mode-live-opt">Ribosome</button>
        <button type="button" className="landing-mode-live-opt">Golgi apparatus</button>
      </div>
    ),
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    tagline: 'Spaced repetition',
    description: 'Flip cards scheduled by FSRS — definitions, formulas, and facts from your journey.',
    preview: (
      <div className="landing-mode-live flashcards">
        <div className="landing-mode-live-card-scene">
          <div className="landing-mode-live-card-front">
            <span className="landing-mode-live-flip-label">Front</span>
            <strong>What is the function of mitochondria?</strong>
            <span className="landing-mode-live-flip-hint">Space to flip</span>
          </div>
        </div>
        <div className="landing-mode-live-card-actions">
          <span className="landing-mode-live-grade">Again</span>
          <span className="landing-mode-live-grade">Hard</span>
          <span className="landing-mode-live-grade active">Good</span>
          <span className="landing-mode-live-grade">Easy</span>
        </div>
      </div>
    ),
  },
  {
    id: 'feynman',
    name: 'Feynman',
    tagline: 'Explain it back',
    description: 'Teach the concept in plain language — AI scores clarity and catches gaps in understanding.',
    preview: (
      <div className="landing-mode-live feynman">
        <p className="landing-mode-live-feynman-prompt">
          Explain <strong>photosynthesis</strong> as if teaching a friend who has never heard of it.
        </p>
        <div className="landing-mode-live-typefield">
          Plants use sunlight to turn CO₂ and water into glucose…
          <span className="landing-mode-live-cursor">|</span>
        </div>
        <span className="landing-mode-live-feynman-hint">Press Submit when ready</span>
      </div>
    ),
  },
];

export default function LandingInteractiveModes() {
  const [active, setActive] = useState('guide');
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
