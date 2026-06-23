import { ApGridFlagIcon } from './ApClassroomIcons';

export default function ApClassroomQuestionGrid({
  total,
  currentIndex,
  answersByIndex,
  flagged,
  onJump,
  showCurrentPin = true,
}) {
  return (
    <div className="ap-classroom-question-grid" role="grid" aria-label="Question navigation">
      {Array.from({ length: total }, (_, i) => {
        const answered = answersByIndex[i] != null;
        const isCurrent = i === currentIndex;
        const isFlagged = flagged.has(i);

        return (
          <button
            key={i}
            type="button"
            role="gridcell"
            className={`ap-classroom-grid-cell${answered ? ' answered' : ''}${isCurrent && showCurrentPin ? ' current' : ''}${isFlagged ? ' flagged' : ''}`}
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${isFlagged ? ', marked for review' : ''}${answered ? ', answered' : ', unanswered'}`}
            aria-current={isCurrent && showCurrentPin ? 'true' : undefined}
          >
            {isCurrent && showCurrentPin && (
              <svg className="ap-classroom-grid-pin" viewBox="0 0 14 18" aria-hidden="true">
                <path
                  d="M7 0C4.2 0 2 2.2 2 5c0 4.5 5 13 5 13s5-8.5 5-13c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
                  fill="currentColor"
                />
              </svg>
            )}
            {i + 1}
            {isFlagged && <ApGridFlagIcon />}
          </button>
        );
      })}
    </div>
  );
}
