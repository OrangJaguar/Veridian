import { useState, useMemo } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { playStudySound, triggerStudyHaptic } from '@/utils/study/feedback';
import { gradeMcqResponse, resolveCorrectAnswer } from '@/utils/study/resolveCorrectAnswer';
import { gradeQuestionResponse } from '@/utils/quiz/gradeQuestionResponse';
import ShortAnswerInput from '@/components/study/quiz/inputs/ShortAnswerInput';

export default function LearningGuideCheckIn({ checkIn, onAnswered, initialAnswer }) {
  const [selected, setSelected] = useState(initialAnswer?.selected ?? null);
  const [revealed, setRevealed] = useState(
    Boolean(initialAnswer?.revealed || initialAnswer?.skipped || initialAnswer?.selected != null),
  );

  const options = checkIn?.options ?? [];
  const resolvedCorrect = useMemo(
    () => resolveCorrectAnswer(checkIn?.correctAnswer, options),
    [checkIn?.correctAnswer, options],
  );

  if (!checkIn?.question) return null;

  const checkType = checkIn?.type ?? (options.length === 2 && options.includes('True') ? 'trueFalse' : 'multipleChoice');
  const isCorrect = selected != null && (
    checkType === 'shortAnswer'
      ? gradeQuestionResponse(selected, { type: 'shortAnswer', correctAnswer: checkIn.correctAnswer })
      : gradeMcqResponse(selected, checkIn.correctAnswer, options)
  );

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const correct = gradeMcqResponse(opt, checkIn.correctAnswer, options);
    playStudySound(correct ? 'correct' : 'wrong');
    triggerStudyHaptic(correct ? 'correct' : 'wrong');
    onAnswered?.({ selected: opt, correct, skipped: false });
  };

  const handleSkip = () => {
    if (revealed) return;
    setRevealed(true);
    onAnswered?.({ selected: null, correct: null, skipped: true });
  };

  return (
    <section className="guide-checkin" aria-labelledby="guide-checkin-heading">
      <div className="guide-checkin-header">
        <span className="guide-checkin-badge">Quick check-in</span>
        <h3 id="guide-checkin-heading" className="guide-checkin-question">
          <LatexRenderer text={checkIn.question} />
        </h3>
      </div>

      {checkType === 'shortAnswer' ? (
        <ShortAnswerInput
          value={typeof selected === 'string' ? selected : ''}
          onSubmit={(text) => {
            if (revealed) return;
            setSelected(text);
            setRevealed(true);
            const correct = gradeQuestionResponse(text, { type: 'shortAnswer', correctAnswer: checkIn.correctAnswer });
            playStudySound(correct ? 'correct' : 'wrong');
            triggerStudyHaptic(correct ? 'correct' : 'wrong');
            onAnswered?.({ selected: text, correct, skipped: false });
          }}
          disabled={revealed}
          answered={revealed}
        />
      ) : options.length > 0 ? (
        <div className="guide-checkin-options" role="listbox" aria-label="Answer choices">
          {options.map((opt) => {
            let stateClass = '';
            if (revealed && resolvedCorrect && opt === resolvedCorrect) stateClass = ' correct';
            else if (revealed && opt === selected && !isCorrect) stateClass = ' wrong';
            else if (selected === opt) stateClass = ' selected';

            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected === opt}
                className={`guide-checkin-option${stateClass}`}
                disabled={revealed}
                onClick={() => handleSelect(opt)}
              >
                <LatexRenderer text={opt} />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="guide-checkin-open">Reflect on the question above before continuing.</p>
      )}

      {revealed && !isCorrect && resolvedCorrect && (
        <p className="guide-checkin-correct-answer">
          <strong>Correct answer:</strong>{' '}
          <LatexRenderer text={resolvedCorrect} />
        </p>
      )}

      {revealed && checkIn.explanation && (
        <p className={`guide-checkin-feedback${isCorrect ? ' is-correct' : ' is-wrong'}`}>
          <LatexRenderer text={checkIn.explanation} />
        </p>
      )}

      {!revealed && (
        <button type="button" className="guide-checkin-skip" onClick={handleSkip}>
          Skip for now
        </button>
      )}
    </section>
  );
}
