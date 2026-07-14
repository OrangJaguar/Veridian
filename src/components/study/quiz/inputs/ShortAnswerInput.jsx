import { useState } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';

export default function ShortAnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  answered,
}) {
  const [local, setLocal] = useState(value ?? '');

  const handleChange = (e) => {
    setLocal(e.target.value);
    onChange?.(e.target.value);
  };

  const handleSubmit = () => {
    if (!local.trim() || disabled || answered) return;
    onSubmit?.(local.trim());
  };

  return (
    <div className="quiz-answer-input quiz-short-answer-input">
      <input
        type="text"
        className="quiz-short-answer-field typing-answer-input"
        value={local}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
          }
        }}
        disabled={disabled || answered}
        placeholder="Type your answer"
        aria-label="Short answer response"
      />
      {!answered && (
        <button
          type="button"
          className="btn btn-primary btn-sm quiz-short-answer-submit"
          onClick={handleSubmit}
          disabled={disabled || !local.trim()}
        >
          Check answer
        </button>
      )}
    </div>
  );
}
