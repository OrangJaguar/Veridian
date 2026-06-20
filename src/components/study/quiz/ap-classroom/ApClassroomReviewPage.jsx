import ApClassroomQuestionGrid from './ApClassroomQuestionGrid';

export default function ApClassroomReviewPage({
  title,
  total,
  answersByIndex,
  flagged,
  onJump,
}) {
  return (
    <div className="ap-classroom-review">
      <h2 className="ap-classroom-review-heading">Check Your Work</h2>
      <p className="ap-classroom-review-text">
        Click on any question to return to it and review your answer.
      </p>
      <p className="ap-classroom-review-text">
        Click <strong>Submit</strong> when you have completed the assignment.
      </p>

      <div className="ap-classroom-review-card">
        <div className="ap-classroom-review-card-header">
          <span>{title} Questions</span>
          <div className="ap-classroom-legend">
            <span className="ap-classroom-legend-item">
              <span className="ap-classroom-legend-dashed" aria-hidden="true" />
              Unanswered
            </span>
            <span className="ap-classroom-legend-item">
              <svg className="ap-classroom-legend-flag" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 1v10M1 1h7l-1.5 2.5L8 6H1" />
              </svg>
              For Review
            </span>
          </div>
        </div>
        <div className="ap-classroom-review-card-body">
          <ApClassroomQuestionGrid
            total={total}
            currentIndex={-1}
            answersByIndex={answersByIndex}
            flagged={flagged}
            onJump={onJump}
            showCurrentPin={false}
          />
        </div>
      </div>
    </div>
  );
}
