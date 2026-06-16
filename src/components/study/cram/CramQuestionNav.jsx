import { useRef, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function CramQuestionNav({
  open,
  onToggle,
  currentIndex,
  total,
  answersByIndex,
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
    <div className="quiz-nav-wrap cram-nav-wrap" ref={popoverRef}>
      <button type="button" className="quiz-nav-trigger" onClick={() => onToggle(!open)}>
        {currentIndex + 1}/{total}
        <ChevronUp size={14} className={`quiz-nav-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="quiz-nav-popover">
          <div className="quiz-nav-legend">
            <span><i className="quiz-nav-dot cram-correct" /> Correct</span>
            <span><i className="quiz-nav-dot cram-wrong" /> Wrong</span>
            <span><i className="quiz-nav-dot unanswered" /> Not yet</span>
          </div>
          <div className="quiz-nav-grid cram-nav-grid">
            {Array.from({ length: total }, (_, i) => {
              const ans = answersByIndex[i];
              const isCurrent = i === currentIndex;
              let stateClass = '';
              if (ans?.correct === true) stateClass = ' correct';
              else if (ans?.correct === false) stateClass = ' wrong';
              return (
                <button
                  key={i}
                  type="button"
                  className={`quiz-nav-cell cram-nav-cell${stateClass}${isCurrent ? ' current' : ''}`}
                  onClick={() => {
                    onJump(i);
                    onToggle(false);
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
