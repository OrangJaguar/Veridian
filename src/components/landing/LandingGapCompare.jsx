import { useState } from 'react';

const OTHER_APPS = [
  'Flashcards, quizzes, notes — all separate tools',
  'You decide what to study and when',
  'No plan if you don\'t bring your own material',
  'Easy to fall behind or over-study the wrong things',
];

const VERIDIAN = [
  'One Journey — structure, schedule, and study modes together',
  'Due Today tells you exactly what to do right now',
  'AI builds the plan from your notes, or clone from the Library',
  'Spaced repetition keeps you on track until exam day',
];

export default function LandingGapCompare() {
  const [side, setSide] = useState('veridian');

  return (
    <div className="landing-gap-compare">
      <div className="landing-gap-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={side === 'others'}
          className={`landing-gap-tab${side === 'others' ? ' active' : ''}`}
          onClick={() => setSide('others')}
        >
          Typical study apps
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={side === 'veridian'}
          className={`landing-gap-tab${side === 'veridian' ? ' active' : ''}`}
          onClick={() => setSide('veridian')}
        >
          Veridian
        </button>
      </div>
      <div className="landing-gap-panel" role="tabpanel">
        <ul className={`landing-gap-list${side === 'veridian' ? ' landing-gap-list-good' : ''}`}>
          {(side === 'others' ? OTHER_APPS : VERIDIAN).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="landing-gap-hint">
          {side === 'others'
            ? 'Great tools — but the strategy is still on you.'
            : 'The plan is built in. You just follow Due Today.'}
        </p>
      </div>
    </div>
  );
}
