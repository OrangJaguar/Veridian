import LatexRenderer from '@/components/shared/LatexRenderer';
import { optionLetter } from '@/hooks/study/useQuizSessionState';

export default function ApClassroomChoiceRow({
  option,
  optionIndex,
  selected,
  crossedOut,
  onSelect,
  onToggleCrossout,
}) {
  const letter = optionLetter(optionIndex);

  return (
    <div className="ap-classroom-choice-row-wrap">
      <button
        type="button"
        className={`ap-classroom-choice-row${selected ? ' selected' : ''}${crossedOut ? ' crossed-out' : ''}`}
        onClick={() => onSelect(option)}
        disabled={crossedOut}
        aria-pressed={selected}
      >
        <span className="ap-classroom-choice-circle">{letter}</span>
        <span className="ap-classroom-choice-text">
          <LatexRenderer text={option} />
        </span>
      </button>
      <button
        type="button"
        className={`ap-classroom-crossout-btn${crossedOut ? ' active' : ''}`}
        onClick={() => onToggleCrossout(optionIndex)}
        aria-label={`Cross out option ${letter}`}
        aria-pressed={crossedOut}
      >
        <span className="ap-classroom-crossout-circle">{letter}</span>
      </button>
    </div>
  );
}
