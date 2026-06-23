import LatexRenderer from '@/components/shared/LatexRenderer';
import { optionLetter } from '@/hooks/study/useQuizSessionState';
import { ApAbcCrossoutIcon, ApFlagIcon } from './ApClassroomIcons';
import ApClassroomChoiceRow from './ApClassroomChoiceRow';

export default function ApClassroomQuestionView({
  question,
  questionNumber,
  selected,
  flagged,
  crossedOut,
  crossoutMode,
  onSelect,
  onToggleFlag,
  onToggleCrossoutMode,
  onToggleCrossout,
  onUndoCrossout,
}) {
  const options = question?.options ?? [];
  const hasCrossouts = crossedOut.size > 0;

  return (
    <div className="ap-classroom-question-card">
      <div className="ap-classroom-question-toolbar">
        <div className="ap-classroom-question-header-left">
          <span className="ap-classroom-number-badge">{questionNumber}</span>
          <button
            type="button"
            className={`ap-classroom-flag-btn${flagged ? ' active' : ''}`}
            onClick={onToggleFlag}
            aria-pressed={flagged}
          >
            <ApFlagIcon filled={flagged} />
            Mark for Review
          </button>
        </div>
        <button
          type="button"
          className={`ap-classroom-abc-toggle${crossoutMode ? ' active' : ''}`}
          onClick={onToggleCrossoutMode}
          aria-pressed={crossoutMode}
          aria-label="Cross out answer choices you think are wrong"
          title="Cross out answer choices you think are wrong"
        >
          <ApAbcCrossoutIcon />
        </button>
      </div>

      <div className="ap-classroom-question-body">
        <div className="ap-classroom-stem">
          <LatexRenderer text={question?.stem} />
        </div>

        {crossoutMode && hasCrossouts && (
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
              crossoutMode={crossoutMode}
              onSelect={onSelect}
              onToggleCrossout={onToggleCrossout}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
