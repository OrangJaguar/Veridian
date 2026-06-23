import { ApFlagIcon } from './ApClassroomIcons';
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
          <div className="ap-classroom-legend ap-classroom-legend--inline">
            <span className="ap-classroom-legend-item">
              <span className="ap-classroom-legend-dashed" aria-hidden="true" />
              <span>Unanswered</span>
            </span>
            <span className="ap-classroom-legend-divider" aria-hidden="true" />
            <span className="ap-classroom-legend-item">
              <ApFlagIcon filled className="ap-classroom-legend-flag-icon" />
              <span>For Review</span>
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
