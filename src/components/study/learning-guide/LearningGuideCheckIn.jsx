import { useState } from 'react';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { playStudySound, triggerStudyHaptic } from '@/utils/study/feedback';

export default function LearningGuideCheckIn({ checkIn, onAnswered }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  if (!checkIn?.question) return null;

  const options = checkIn.options ?? [];
  const isCorrect = selected === checkIn.correctAnswer;

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
    const correct = opt === checkIn.correctAnswer;
    playStudySound(correct ? 'correct' : 'wrong');
    triggerStudyHaptic(correct ? 'correct' : 'wrong');
    onAnswered?.({ selected: opt, correct });
  };

  const handleSkip = () => {
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

      {options.length > 0 ? (
        <div className="guide-checkin-options" role="listbox" aria-label="Answer choices">
          {options.map((opt) => {
            let stateClass = '';
            if (revealed && opt === checkIn.correctAnswer) stateClass = ' correct';
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
