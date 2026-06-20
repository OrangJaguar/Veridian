import { MapPin } from 'lucide-react';

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
            className={`ap-classroom-grid-cell${answered ? ' answered' : ''}${isCurrent && showCurrentPin ? ' current' : ''}`}
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${isFlagged ? ', marked for review' : ''}${answered ? ', answered' : ', unanswered'}`}
            aria-current={isCurrent && showCurrentPin ? 'true' : undefined}
          >
            {isCurrent && showCurrentPin && (
              <MapPin size={14} className="ap-classroom-grid-pin" aria-hidden="true" />
            )}
            {i + 1}
            {isFlagged && (
              <svg className="ap-classroom-grid-flag" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 1v10M1 1h7l-1.5 2.5L8 6H1" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
