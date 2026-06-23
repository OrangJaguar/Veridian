import { useState } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';

export default function FlashcardPreviewModal({ deckTitle, cards = [], onClose }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  const go = (next) => {
    setIndex(next);
    setFlipped(false);
  };

  return (
    <div className="flashcard-preview-backdrop" role="presentation" onClick={onClose}>
      <div
        className="flashcard-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flashcard-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flashcard-preview-header">
          <div>
            <h2 id="flashcard-preview-title" className="flashcard-preview-title">
              {deckTitle}
            </h2>
            <p className="flashcard-preview-count">
              {cards.length} card{cards.length === 1 ? '' : 's'} · preview only
            </p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </header>

        {cards.length === 0 ? (
          <p className="journeys-status">No cards in this deck yet.</p>
        ) : (
          <>
            <button
              type="button"
              className={`flashcard-preview-card${flipped ? ' flipped' : ''}`}
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? 'Show front' : 'Show back'}
            >
              <span className="flashcard-preview-side-label">
                {flipped ? 'Back' : 'Front'}
              </span>
              <div className="flashcard-preview-card-text">
                <LatexRenderer text={flipped ? card.back : card.front} />
              </div>
              <span className="flashcard-preview-flip-hint">Tap to flip</span>
            </button>

            <div className="flashcard-preview-nav">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={index <= 0}
                onClick={() => go(index - 1)}
              >
                Previous
              </button>
              <span className="flashcard-preview-index">
                {index + 1} / {cards.length}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={index >= cards.length - 1}
                onClick={() => go(index + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
