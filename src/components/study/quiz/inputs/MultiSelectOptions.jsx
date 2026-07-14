import LatexRenderer from '@/components/shared/LatexRenderer';

export default function MultiSelectOptions({
  options = [],
  value = [],
  onChange,
  disabled,
  answered,
  correctAnswer = [],
  showFeedback,
}) {
  const selected = new Set(value);

  const toggle = (opt) => {
    if (disabled || answered) return;
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange?.([...next]);
  };

  const optionClass = (opt) => {
    const isSelected = selected.has(opt);
    if (!showFeedback || !answered) {
      return isSelected ? ' selected' : '';
    }
    const isCorrect = correctAnswer.includes(opt);
    if (isSelected && isCorrect) return ' option-correct';
    if (isSelected && !isCorrect) return ' option-wrong';
    if (!isSelected && isCorrect) return ' option-correct';
    return '';
  };

  return (
    <div className="quiz-answer-input quiz-multiselect-options options-grid">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          className={`option-btn quiz-multiselect-option${optionClass(opt)}`}
          disabled={disabled}
          onClick={() => toggle(opt)}
          aria-pressed={selected.has(opt)}
        >
          <span className="option-key">{i + 1}</span>
          <LatexRenderer text={opt} />
        </button>
      ))}
      {!answered && (
        <p className="quiz-multiselect-hint">Select all that apply, then check your answer.</p>
      )}
    </div>
  );
}
