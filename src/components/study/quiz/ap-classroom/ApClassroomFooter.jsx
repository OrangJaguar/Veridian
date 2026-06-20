import { ChevronUp } from 'lucide-react';
import ApClassroomLogo from './ApClassroomLogo';

export default function ApClassroomFooter({
  variant = 'question',
  currentIndex,
  total,
  navModalOpen,
  onToggleNav,
  onBack,
  onNext,
  onSubmit,
  canGoBack,
  canGoNext,
}) {
  if (variant === 'review') {
    return (
      <footer className="ap-classroom-footer review">
        <div className="ap-classroom-footer-left">
          <ApClassroomLogo light />
        </div>
        <div className="ap-classroom-footer-center" />
        <div className="ap-classroom-footer-right">
          <button
            type="button"
            className="ap-classroom-btn ap-classroom-btn-outline-light"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className="ap-classroom-btn ap-classroom-btn-primary"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="ap-classroom-footer">
      <div className="ap-classroom-footer-left">
        <ApClassroomLogo />
      </div>
      <div className="ap-classroom-footer-center">
        <button
          type="button"
          className="ap-classroom-question-pill"
          onClick={onToggleNav}
          aria-expanded={navModalOpen}
          aria-haspopup="dialog"
        >
          Question {currentIndex + 1} of {total}
          <ChevronUp
            size={16}
            className={`ap-classroom-question-pill-chevron${navModalOpen ? ' open' : ''}`}
          />
        </button>
      </div>
      <div className="ap-classroom-footer-right">
        <button
          type="button"
          className="ap-classroom-btn ap-classroom-btn-primary"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Back
        </button>
        <button
          type="button"
          className="ap-classroom-btn ap-classroom-btn-primary"
          onClick={onNext}
          disabled={!canGoNext}
        >
          Next
        </button>
      </div>
    </footer>
  );
}
