import { useState } from 'react';
import VeridianSlider from '@/components/shared/form/VeridianSlider';

const DEFAULT_VALUE = 50;

export default function PreQuizConfidenceStep({
  onSubmit,
  onExit,
  submitting = false,
  title = 'Before you start',
}) {
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleChange = (e) => {
    setValue(Number(e.target.value));
    if (!hasInteracted) setHasInteracted(true);
  };

  const handleContinue = () => {
    if (!hasInteracted || submitting) return;
    onSubmit(value);
  };

  return (
    <div className="pre-quiz-confidence-step study-mode-view">
      <div className="pre-quiz-confidence-inner">
        <h1 className="pre-quiz-confidence-title">{title}</h1>
        <p className="pre-quiz-confidence-prompt">
          Before you start — how confident are you feeling about this material right now?
        </p>

        <div className={`pre-quiz-confidence-slider-wrap${hasInteracted ? ' is-interacted' : ''}`}>
          <VeridianSlider
            id="pre-quiz-confidence"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={handleChange}
            disabled={submitting}
          />
          <div className="pre-quiz-confidence-labels">
            <span>Not at all confident</span>
            <span>Very confident</span>
          </div>
        </div>

        <div className="pre-quiz-confidence-actions">
          {onExit && (
            <button type="button" className="btn btn-ghost" onClick={onExit} disabled={submitting}>
              Exit
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!hasInteracted || submitting}
          >
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
