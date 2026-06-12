import { useState, useEffect, useCallback, useRef } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { Rating, scheduleCard } from '@/utils/fsrs';
import { playStudySound, triggerStudyHaptic } from '@/utils/study/feedback';
import { createEmptyMasteryStats } from '@/utils/study/masteryStats';

const RATING_MAP = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const RATING_KEYS = ['again', 'hard', 'good', 'easy'];

function ensureStats(masteryStatsRef, cardId, front) {
  if (!masteryStatsRef.current[cardId]) {
    masteryStatsRef.current[cardId] = createEmptyMasteryStats(front);
  }
  return masteryStatsRef.current[cardId];
}

export default function FlashcardReview({
  cards,
  onRate,
  onComplete,
  onExit,
  masteryStatsRef,
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState([]);
  const cardStartRef = useRef(Date.now());

  const card = cards[index];
  const remaining = cards.length - index;
  const progressPct = cards.length ? (index / cards.length) * 100 : 0;

  useEffect(() => {
    cardStartRef.current = Date.now();
  }, [index, card?.cardId]);

  const handleFlip = useCallback(() => {
    setFlipped((wasFlipped) => {
      if (!wasFlipped) {
        playStudySound('flip');
        triggerStudyHaptic('flip');
      }
      return true;
    });
  }, []);

  const handleRate = useCallback((rating) => {
    if (!card) return;

    const recallElapsed = (Date.now() - cardStartRef.current) / 1000;
    const stats = ensureStats(masteryStatsRef, card.cardId, card.front);
    stats.recallSec += recallElapsed;
    if (rating === 'again') stats.recallAgainCount += 1;

    const previousDue = card.fsrsState?.due;
    const newState = scheduleCard(card, RATING_MAP[rating]);
    const review = {
      cardId: card.cardId,
      rating,
      previousDue,
      newDue: newState.due,
    };
    const nextReviews = [...reviews, review];

    setReviews(nextReviews);
    void onRate(card, newState, review);

    if (index + 1 >= cards.length) {
      onComplete(nextReviews, {
        again: nextReviews.filter((r) => r.rating === 'again').length,
        hard: nextReviews.filter((r) => r.rating === 'hard').length,
        good: nextReviews.filter((r) => r.rating === 'good').length,
        easy: nextReviews.filter((r) => r.rating === 'easy').length,
      });
      return;
    }

    setIndex(index + 1);
    setFlipped(false);
  }, [card, cards.length, index, masteryStatsRef, onComplete, onRate, reviews]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!card) return;

      if (!flipped && (e.key === ' ' || e.key === 'Spacebar')) {
        e.preventDefault();
        handleFlip();
        return;
      }

      if (flipped) {
        const num = Number(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          handleRate(RATING_KEYS[num - 1]);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, flipped, handleFlip, handleRate]);

  if (cards.length === 0) {
    return <p className="journeys-status">No cards to review.</p>;
  }

  if (!card) {
    return <VeridianLoading size="sm" />;
  }

  return (
    <div className="study-mode-view flashcard-mode-view">
      <div className="module-header">
        <div className="progress-container">
          <span className="progress-text">{remaining} remaining</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <button type="button" className="util-btn exit-btn" onClick={onExit}>
          Exit
        </button>
      </div>

      <div className="card-scene">
        <div
          className={`card-object${flipped ? ' is-flipped' : ''}`}
          onClick={!flipped ? handleFlip : undefined}
          role="presentation"
        >
          <div className="card-face card-face-front">
            <span className="card-label">Front</span>
            <div className="card-content">
              <LatexRenderer text={card.front} />
            </div>
          </div>
          <div className="card-face card-face-back">
            <span className="card-label">Back</span>
            <div className="card-content">
              <LatexRenderer text={card.back} />
            </div>
          </div>
        </div>
      </div>

      {!flipped ? (
        <div className="action-row flashcard-front-actions">
          <span className="keyboard-hint">Spacebar to flip</span>
          <button type="button" className="btn btn-primary" onClick={handleFlip}>
            Show Answer
          </button>
        </div>
      ) : (
        <div className="action-row flashcard-back-actions">
          {RATING_KEYS.map((r, i) => (
            <button
              key={r}
              type="button"
              className={`btn srs-btn ${r}`}
              onClick={() => handleRate(r)}
            >
              <span>{r.charAt(0).toUpperCase() + r.slice(1)}</span>
              <span className="key">Press {i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
