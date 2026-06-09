import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { Rating, scheduleCard } from '@/utils/fsrs';
import { playStudySound, triggerStudyHaptic } from '@/utils/study/feedback';

const RATING_MAP = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export default function FlashcardReview({ cards, onRate, onComplete }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviews, setReviews] = useState([]);
  const counts = { again: 0, hard: 0, good: 0, easy: 0 };

  reviews.forEach((r) => { counts[r.rating] += 1; });

  const card = cards[index];

  if (cards.length === 0) {
    return <p className="journeys-status">No cards to review.</p>;
  }

  if (!card) {
    return <p className="journeys-status">Saving review…</p>;
  }

  const handleFlip = () => {
    if (!flipped) {
      playStudySound('flip');
      triggerStudyHaptic('flip');
    }
    setFlipped(true);
  };

  const handleRate = async (rating) => {
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
    await onRate(card, newState, review);

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
  };

  return (
    <div className="study-flashcard">
      <p className="study-flashcard-progress">Card {index + 1} / {cards.length}</p>
      <AnimatePresence mode="wait">
        <motion.div
          key={card.cardId}
          className={`study-card-scene${flipped ? ' flipped' : ''}`}
          onClick={handleFlip}
          role="presentation"
          initial={{ opacity: 0, rotateY: flipped ? 180 : 0 }}
          animate={{ opacity: 1, rotateY: flipped ? 180 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="study-card-face front">
            <span className="study-card-label">Front</span>
            <LatexRenderer text={card.front} />
          </div>
          <div className="study-card-face back">
            <span className="study-card-label">Back</span>
            <LatexRenderer text={card.back} />
          </div>
        </motion.div>
      </AnimatePresence>

      {!flipped ? (
        <button type="button" className="btn btn-primary" onClick={handleFlip}>
          Show Answer
        </button>
      ) : (
        <div className="study-srs-row">
          {(['again', 'hard', 'good', 'easy']).map((r) => (
            <button key={r} type="button" className={`btn srs-btn ${r}`} onClick={() => handleRate(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
