import { X } from 'lucide-react';
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

        <div className="ap-classroom-legend">
          <span className="ap-classroom-legend-item">
            <MapPinIcon />
            Current
          </span>
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
            className="ap-classroom-btn ap-classroom-btn-outline"
            onClick={onGoToReview}
          >
            Go to Review Page
          </button>
        </div>
      </div>
    </>
  );
}

function MapPinIcon() {
  return (
    <svg className="ap-classroom-legend-pin" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M7 1C4.8 1 3 2.8 3 5c0 3 4 7 4 7s4-4 4-7c0-2.2-1.8-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  );
}
