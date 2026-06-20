import LatexRenderer from '@/components/shared/LatexRenderer';
import { optionLetter } from '@/hooks/study/useQuizSessionState';
import ApClassroomChoiceRow from './ApClassroomChoiceRow';

export default function ApClassroomQuestionView({
  question,
  questionNumber,
  selected,
  flagged,
  crossedOut,
  onSelect,
  onToggleFlag,
  onToggleCrossout,
  onUndoCrossout,
}) {
  const options = question?.options ?? [];
  const hasCrossouts = crossedOut.size > 0;

  return (
    <div className="ap-classroom-question-card">
      <div className="ap-classroom-question-header">
        <div className="ap-classroom-question-header-left">
          <span className="ap-classroom-number-badge">{questionNumber}</span>
          <button
            type="button"
            className={`ap-classroom-flag-btn${flagged ? ' active' : ''}`}
            onClick={onToggleFlag}
            aria-pressed={flagged}
          >
            <svg className="ap-classroom-flag-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4v16M4 4h12l-2 4 2 4H4" />
            </svg>
            Mark for Review
          </button>
        </div>
        <span className="ap-classroom-abc-tool" aria-hidden="true">ABC</span>
      </div>

      <div className="ap-classroom-stem">
        <LatexRenderer text={question?.stem} />
      </div>

      {hasCrossouts && (
        <div className="ap-classroom-undo-row">
          <button type="button" className="ap-classroom-undo-link" onClick={onUndoCrossout}>
            Undo
          </button>
        </div>
      )}

      <div className="ap-classroom-choices">
        {options.map((opt, i) => (
          <ApClassroomChoiceRow
            key={`${question?.id}-${i}`}
            option={opt}
            optionIndex={i}
            selected={selected === opt}
            crossedOut={crossedOut.has(optionLetter(i))}
            onSelect={onSelect}
            onToggleCrossout={onToggleCrossout}
          />
        ))}
      </div>
    </div>
  );
}
