import { useRef, useEffect } from 'react';
import { ChevronUp, Flag } from 'lucide-react';

export default function QuizQuestionNav({
  open,
  onToggle,
  currentIndex,
  total,
  answersByIndex,
  flagged,
  onJump,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onToggle]);

  return (
    <div className="quiz-nav-wrap" ref={popoverRef}>
      <button type="button" className="quiz-nav-trigger" onClick={() => onToggle(!open)}>
        {currentIndex + 1}/{total}
        <ChevronUp size={14} className={`quiz-nav-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="quiz-nav-popover">
          <div className="quiz-nav-legend">
            <span><i className="quiz-nav-dot answered" /> Answered</span>
            <span><i className="quiz-nav-dot unanswered" /> Unanswered</span>
            <span><Flag size={10} /> Flagged</span>
          </div>
          <div className="quiz-nav-grid">
            {Array.from({ length: total }, (_, i) => {
              const answered = answersByIndex[i] != null;
              const isFlagged = flagged.has(i);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={i}
                  type="button"
                  className={`quiz-nav-cell${answered ? ' answered' : ''}${isCurrent ? ' current' : ''}${isFlagged ? ' flagged' : ''}`}
                  onClick={() => {
                    onJump(i);
                    onToggle(false);
                  }}
                >
                  {i + 1}
                  {isFlagged && <Flag size={9} className="quiz-nav-cell-flag" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
