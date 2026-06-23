import { X } from 'lucide-react';
import { ApFlagIcon } from './ApClassroomIcons';
import ApClassroomQuestionGrid from './ApClassroomQuestionGrid';

export default function ApClassroomNavModal({
  title,
  total,
  currentIndex,
  answersByIndex,
  flagged,
  onClose,
  onJump,
  onGoToReview,
}) {
  return (
    <>
      <div className="ap-classroom-backdrop" onClick={onClose} role="presentation" />
      <div
        className="ap-classroom-nav-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ap-nav-modal-title"
      >
        <div className="ap-classroom-nav-modal-header">
          <h2 id="ap-nav-modal-title" className="ap-classroom-nav-modal-title">
            {title} Questions
          </h2>
          <button
            type="button"
            className="ap-classroom-nav-modal-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ap-classroom-legend ap-classroom-legend--modal">
          <span className="ap-classroom-legend-item">
            <svg className="ap-classroom-legend-pin" viewBox="0 0 14 18" aria-hidden="true">
              <path
                d="M7 0C4.2 0 2 2.2 2 5c0 4.5 5 13 5 13s5-8.5 5-13c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
                fill="currentColor"
              />
            </svg>
            <span>Current</span>
          </span>
          <span className="ap-classroom-legend-divider" aria-hidden="true" />
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

        <ApClassroomQuestionGrid
          total={total}
          currentIndex={currentIndex}
          answersByIndex={answersByIndex}
          flagged={flagged}
          onJump={onJump}
          showCurrentPin
        />

        <div className="ap-classroom-nav-modal-footer">
          <button
            type="button"
            className="ap-classroom-btn ap-classroom-btn-outline ap-classroom-btn-pill-wide"
            onClick={onGoToReview}
          >
            Go to Review Page
          </button>
        </div>
      </div>
    </>
  );
}
