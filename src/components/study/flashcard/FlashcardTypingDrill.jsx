import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  buildTypingQueue,
  evaluateTypingGuess,
  splitAnswerForReveal,
} from '@/utils/study/typingDrill';
import { triggerAnswerFeedback } from '@/utils/study/feedback';
import { createEmptyMasteryStats } from '@/utils/study/masteryStats';

function MaskedAnswer({ item, revealText, skipped }) {
  const parts = splitAnswerForReveal(item.fullAnswer, item.expected);

  if (!parts.hasBlank) {
    return <p className="typing-masked-answer">{item.masked}</p>;
  }

  return (
    <p className="typing-masked-answer">
      {parts.before}
      <span className="typing-blank-wrap">
        <span className={`typing-reveal${skipped ? ' skipped' : ''}`}>{revealText || ''}</span>
        <span className="typing-blank-line" />
      </span>
      {parts.after}
    </p>
  );
}

function ensureStats(masteryStatsRef, cardId, front) {
  if (!masteryStatsRef.current[cardId]) {
    masteryStatsRef.current[cardId] = createEmptyMasteryStats(front);
  }
  return masteryStatsRef.current[cardId];
}

export default function FlashcardTypingDrill({
  cards,
  onComplete,
  onExit,
  masteryStatsRef,
}) {
  const baseQueue = useMemo(() => buildTypingQueue(cards), [cards]);
  const [queue, setQueue] = useState(baseQueue);
  const [deferred, setDeferred] = useState([]);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [revealText, setRevealText] = useState('');
  const [skipped, setSkipped] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', tone: '' });
  const [feedbackFlash, setFeedbackFlash] = useState(null);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const promptStartRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const resultsRef = useRef([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const item = queue[index];
  const progressPct = queue.length ? (index / queue.length) * 100 : 0;

  useEffect(() => {
    setAnswered(false);
    setRevealText('');
    setSkipped(false);
    setFeedback({ text: '', tone: '' });
    promptStartRef.current = Date.now();
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
  }, [index, item?.id]);

  const advance = useCallback(() => {
    if (!answered) return;

    if (index + 1 >= queue.length) {
      if (deferred.length > 0) {
        setQueue((prev) => [...prev, ...deferred]);
        setDeferred([]);
        setIndex(index + 1);
        return;
      }
      onComplete(resultsRef.current);
      return;
    }

    setIndex(index + 1);
  }, [answered, deferred, index, onComplete, queue.length]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (answered) {
          e.preventDefault();
          advance();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answered, advance]);

  const recordTypingTime = (cardId, front) => {
    const elapsed = (Date.now() - promptStartRef.current) / 1000;
    const stats = ensureStats(masteryStatsRef, cardId, front);
    stats.typingSec += elapsed;
    stats.typingAttempts += 1;
    return stats;
  };

  const handleCheck = () => {
    if (!item || answered) return;
    const guess = inputRef.current?.value ?? '';
    if (!guess.trim()) return;

    const stats = recordTypingTime(item.id, item.front);
    const { accepted, distance } = evaluateTypingGuess(guess, item.expected);
    const result = {
      cardId: item.id,
      front: item.front,
      expected: item.expected,
      guess,
      accepted,
      skipped: false,
      distance,
    };

    if (accepted) {
      stats.typingCorrectCount += 1;
      setAnswered(true);
      setRevealText(item.expected);
      setResults((prev) => [...prev, result]);
      setFeedback({
        text: distance === 0 ? 'Correct.' : `Accepted (minor typo). Expected: ${item.expected}`,
        tone: 'correct',
      });
      requestAnimationFrame(() => {
        triggerAnswerFeedback(true, { enabled: true });
        setFeedbackFlash('correct');
        window.setTimeout(() => setFeedbackFlash(null), 650);
      });
      return;
    }

    stats.typingWrongAttempts += 1;
    setFeedback({ text: 'Not quite. Try again.', tone: 'wrong' });
    requestAnimationFrame(() => {
      triggerAnswerFeedback(false, { enabled: true });
      setFeedbackFlash('wrong');
      window.setTimeout(() => setFeedbackFlash(null), 650);
    });
  };

  const handleGiveUp = () => {
    if (!item || answered) return;

    const stats = recordTypingTime(item.id, item.front);
    stats.typingSkippedCount += 1;
    if (stats.typingCorrectCount === 0) stats.initiallySkipped = true;

    setAnswered(true);
    setSkipped(true);
    setRevealText(item.expected);
    setResults((prev) => [...prev, {
      cardId: item.id,
      front: item.front,
      expected: item.expected,
      guess: '',
      accepted: false,
      skipped: true,
      distance: Infinity,
    }]);

    setDeferred((prev) => (
      prev.some((q) => q.id === item.id) ? prev : [...prev, { ...item }]
    ));

    setFeedback({ text: 'Skipped.', tone: 'skip' });
  };

  useEffect(() => {
    if (!item && !finishedRef.current) {
      finishedRef.current = true;
      onComplete(resultsRef.current);
    }
  }, [item, onComplete]);

  return (
    <div className={`study-mode-view typing-mode-view${feedbackFlash ? ` study-feedback-flash-${feedbackFlash}` : ''}`}>
      <div className="module-header">
        <div className="progress-container">
          <span className="progress-text">Prompt {index + 1}/{queue.length}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <button type="button" className="util-btn exit-btn" onClick={onExit}>
          Exit
        </button>
      </div>

      <div className="typing-cards-stack">
        <div className="preview-item typing-front-card">
          <div className="preview-q">{item.front}</div>
        </div>
        <div className="preview-item typing-back-card">
          <MaskedAnswer item={item} revealText={revealText} skipped={skipped} />
        </div>
      </div>

      <div className="typing-controls-block">
        <div className="typing-input-row">
          <div className="typing-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="typing-answer-input"
              placeholder="Type the missing word/phrase..."
              disabled={answered}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (answered) advance();
                  else handleCheck();
                }
              }}
            />
            <div className="typing-feedback-area" aria-live="polite">
              {feedback.text && (
                <div
                  className="feedback-text typing-feedback-text"
                  style={{
                    color: feedback.tone === 'correct'
                      ? 'var(--correct-text)'
                      : feedback.tone === 'wrong'
                        ? 'var(--wrong-text)'
                        : 'var(--skip-text)',
                  }}
                >
                  {feedback.text}
                </div>
              )}
            </div>
          </div>
          {!answered ? (
            <>
              <button type="button" className="btn btn-primary" onClick={handleCheck}>
                Check
              </button>
              <button type="button" className="btn btn-subtle" onClick={handleGiveUp}>
                Give Up
              </button>
            </>
          ) : (
            <>
              <span className="keyboard-hint">Press &apos;Space&apos; to advance</span>
              <button type="button" className="btn btn-primary" onClick={advance}>
                Next
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
