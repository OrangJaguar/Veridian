import LatexRenderer from '@/components/shared/LatexRenderer';

export default function MatchingInput({
  leftItems = [],
  rightItems = [],
  value = {},
  onChange,
  disabled,
  answered,
  correctAnswer = {},
  showFeedback,
}) {
  const handleSelect = (leftItem, rightItem) => {
    if (disabled || answered) return;
    onChange?.({ ...value, [leftItem]: rightItem });
  };

  const rowClass = (leftItem) => {
    if (!showFeedback || !answered) return '';
    const pick = value[leftItem];
    const expected = correctAnswer[leftItem];
    if (!pick) return '';
    return pick === expected ? ' quiz-matching-row--correct' : ' quiz-matching-row--wrong';
  };

  return (
    <div className="quiz-answer-input quiz-matching-grid">
      {leftItems.map((left) => (
        <div key={left} className={`quiz-matching-row${rowClass(left)}`}>
          <span className="quiz-matching-term">
            <LatexRenderer text={left} />
          </span>
          <select
            className="quiz-matching-select"
            value={value[left] ?? ''}
            onChange={(e) => handleSelect(left, e.target.value)}
            disabled={disabled || answered}
            aria-label={`Match definition for ${left}`}
          >
            <option value="">Select match…</option>
            {rightItems.map((right) => (
              <option key={right} value={right}>{right}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
