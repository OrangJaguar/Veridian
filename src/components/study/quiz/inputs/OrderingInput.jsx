import { ChevronDown, ChevronUp } from 'lucide-react';
import LatexRenderer from '@/components/shared/LatexRenderer';

export default function OrderingInput({
  items = [],
  value = [],
  onChange,
  disabled,
  answered,
  correctOrder = [],
  showFeedback,
}) {
  const order = value.length ? value : items;

  const move = (from, to) => {
    if (disabled || answered || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange?.(next);
  };

  const itemClass = (item, idx) => {
    if (!showFeedback || !answered) return '';
    const expected = correctOrder[idx];
    return item === expected ? ' quiz-ordering-item--correct' : ' quiz-ordering-item--wrong';
  };

  return (
    <div className="quiz-answer-input quiz-ordering-list" role="list" aria-label="Order items">
      {order.map((item, idx) => (
        <div
          key={`${item}-${idx}`}
          className={`quiz-ordering-item${itemClass(item, idx)}`}
          role="listitem"
        >
          <span className="quiz-ordering-rank">{idx + 1}</span>
          <span className="quiz-ordering-text">
            <LatexRenderer text={item} />
          </span>
          {!answered && (
            <div className="quiz-ordering-controls">
              <button
                type="button"
                className="util-btn quiz-ordering-btn"
                onClick={() => move(idx, idx - 1)}
                disabled={disabled || idx === 0}
                aria-label="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                className="util-btn quiz-ordering-btn"
                onClick={() => move(idx, idx + 1)}
                disabled={disabled || idx === order.length - 1}
                aria-label="Move down"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
