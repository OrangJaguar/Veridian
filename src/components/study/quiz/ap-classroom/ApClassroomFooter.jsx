import { ChevronDown, ChevronUp } from 'lucide-react';

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
          <span className="ap-classroom-brand">Veridian</span>
        </div>
        <div className="ap-classroom-footer-center" />
        <div className="ap-classroom-footer-right">
          <button
            type="button"
            className="ap-classroom-btn ap-classroom-btn-outline-light ap-classroom-btn-pill"
            onClick={onBack}
          >
            Back
          </button>
          <button
            type="button"
            className="ap-classroom-btn ap-classroom-btn-primary ap-classroom-btn-pill"
            onClick={onSubmit}
          >
            Submit
          </button>
        </div>
      </footer>
    );
  }

  const Chevron = navModalOpen ? ChevronUp : ChevronDown;

  return (
    <footer className="ap-classroom-footer">
      <div className="ap-classroom-footer-left">
        <span className="ap-classroom-brand">Veridian</span>
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
          <Chevron size={16} className="ap-classroom-question-pill-chevron" strokeWidth={2.5} />
        </button>
      </div>
      <div className="ap-classroom-footer-right">
        <button
          type="button"
          className="ap-classroom-btn ap-classroom-btn-primary ap-classroom-btn-pill"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Back
        </button>
        <button
          type="button"
          className="ap-classroom-btn ap-classroom-btn-primary ap-classroom-btn-pill"
          onClick={onNext}
          disabled={!canGoNext}
        >
          Next
        </button>
      </div>
    </footer>
  );
}
