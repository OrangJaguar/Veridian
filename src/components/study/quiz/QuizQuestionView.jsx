import LatexRenderer from '@/components/shared/LatexRenderer';
import QuizAnswerInput from '@/components/study/quiz/inputs/QuizAnswerInput';
import { gradeQuestionResponse } from '@/utils/quiz/gradeQuestionResponse';
import { resolveCorrectAnswer } from '@/utils/study/resolveCorrectAnswer';

export default function QuizQuestionView({
  question,
  selected,
  answered,
  disabled,
  instantFeedback,
  onSelect,
  onSubmit,
  optionClass,
}) {
  if (!question) return null;

  const showFeedback = instantFeedback && answered && selected != null;
  const selectedCorrect = showFeedback ? gradeQuestionResponse(selected, question) : null;

  const mcqOptions = question.type === 'trueFalse'
    ? ['True', 'False']
    : (question.options ?? []);

  const resolvedCorrect = (question.type === 'multipleChoice' || question.type === 'trueFalse')
    ? resolveCorrectAnswer(question.correctAnswer, mcqOptions)
    : null;

  const getOptionClass = (opt) => {
    if (optionClass) return optionClass(opt);
    if (!showFeedback || selected == null) {
      return selected === opt ? ' selected' : '';
    }
    if (selected === opt) {
      return selectedCorrect ? ' option-correct' : ' option-wrong';
    }
    if (!selectedCorrect && resolvedCorrect && opt === resolvedCorrect) {
      return ' option-correct';
    }
    return '';
  };

  const isMcqType = question.type === 'multipleChoice' || question.type === 'trueFalse';

  return (
    <div className="question-block">
      <div className="question-text">
        <LatexRenderer text={question.stem} />
      </div>

      {isMcqType ? (
        <div className="options-grid">
          {mcqOptions.map((opt, i) => (
            <button
              key={opt}
              type="button"
              className={`option-btn${getOptionClass(opt)}`}
              disabled={disabled}
              onClick={() => onSelect?.(opt)}
            >
              <span className="option-key">{i + 1}</span>
              <LatexRenderer text={opt} />
            </button>
          ))}
        </div>
      ) : (
        <QuizAnswerInput
          question={question}
          value={selected}
          onChange={onSelect}
          onSubmit={onSubmit}
          disabled={disabled}
          answered={answered}
          showFeedback={showFeedback}
        />
      )}

      {showFeedback && question.explanation && (
        <div className={`feedback-text${selectedCorrect ? ' feedback-correct' : ' feedback-wrong'}`}>
          <LatexRenderer text={question.explanation} />
        </div>
      )}
    </div>
  );
}
