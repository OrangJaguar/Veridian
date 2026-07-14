import { useState, useEffect } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import ShortAnswerInput from '@/components/study/quiz/inputs/ShortAnswerInput';
import OrderingInput from '@/components/study/quiz/inputs/OrderingInput';
import MatchingInput from '@/components/study/quiz/inputs/MatchingInput';
import MultiSelectOptions from '@/components/study/quiz/inputs/MultiSelectOptions';
import { isInteractiveAnswerComplete } from '@/utils/quiz/gradeQuestionResponse';

export default function QuizAnswerInput({
  question,
  value,
  onChange,
  onSubmit,
  disabled,
  answered,
  showFeedback,
}) {
  const [draft, setDraft] = useState(value ?? getDefaultDraft(question));

  useEffect(() => {
    setDraft(value ?? getDefaultDraft(question));
  }, [question?.id, value]);

  if (!question) return null;

  const handleMcqSelect = (opt) => {
    onChange?.(opt);
    onSubmit?.(opt);
  };

  if (question.type === 'shortAnswer') {
    return (
      <ShortAnswerInput
        value={typeof draft === 'string' ? draft : ''}
        onChange={(text) => {
          setDraft(text);
          onChange?.(text);
        }}
        onSubmit={onSubmit}
        disabled={disabled}
        answered={answered}
      />
    );
  }

  if (question.type === 'ordering') {
    const items = question.options ?? question.items ?? [];
    return (
      <>
        <OrderingInput
          items={items}
          value={Array.isArray(draft) ? draft : items}
          onChange={(next) => {
            setDraft(next);
            onChange?.(next);
          }}
          disabled={disabled}
          answered={answered}
          correctOrder={question.correctAnswer}
          showFeedback={showFeedback}
        />
        {!answered && (
          <button
            type="button"
            className="btn btn-primary btn-sm quiz-ordering-submit"
            onClick={() => onSubmit?.(draft)}
            disabled={disabled || !isInteractiveAnswerComplete(draft, question)}
          >
            Check order
          </button>
        )}
      </>
    );
  }

  if (question.type === 'matching') {
    const draftObj = draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {};
    return (
      <>
        <MatchingInput
          leftItems={question.leftItems}
          rightItems={question.rightItems}
          value={draftObj}
          onChange={(next) => {
            setDraft(next);
            onChange?.(next);
          }}
          disabled={disabled}
          answered={answered}
          correctAnswer={question.correctAnswer}
          showFeedback={showFeedback}
        />
        {!answered && (
          <button
            type="button"
            className="btn btn-primary btn-sm quiz-matching-submit"
            onClick={() => onSubmit?.(draftObj)}
            disabled={disabled || !isInteractiveAnswerComplete(draftObj, question)}
          >
            Check matches
          </button>
        )}
      </>
    );
  }

  if (question.type === 'multiSelect') {
    const selected = Array.isArray(draft) ? draft : [];
    return (
      <>
        <MultiSelectOptions
          options={question.options}
          value={selected}
          onChange={(next) => {
            setDraft(next);
            onChange?.(next);
          }}
          disabled={disabled}
          answered={answered}
          correctAnswer={question.correctAnswer}
          showFeedback={showFeedback}
        />
        {!answered && (
          <button
            type="button"
            className="btn btn-primary btn-sm quiz-multiselect-submit"
            onClick={() => onSubmit?.(selected)}
            disabled={disabled || !selected.length}
          >
            Check answer
          </button>
        )}
      </>
    );
  }

  const options = question.type === 'trueFalse'
    ? ['True', 'False']
    : (question.options ?? []);

  return (
    <div className="quiz-answer-input options-grid">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          className={`option-btn${value === opt ? ' selected' : ''}`}
          disabled={disabled || answered}
          onClick={() => handleMcqSelect(opt)}
        >
          <span className="option-key">{i + 1}</span>
          <LatexRenderer text={opt} />
        </button>
      ))}
    </div>
  );
}

function getDefaultDraft(question) {
  if (!question) return null;
  if (question.type === 'ordering') return question.options ?? question.items ?? [];
  if (question.type === 'matching') return {};
  if (question.type === 'multiSelect') return [];
  return null;
}
