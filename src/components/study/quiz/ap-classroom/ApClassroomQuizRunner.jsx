import { useEffect, useRef, useCallback } from 'react';
import useQuizSessionState from '@/hooks/study/useQuizSessionState';
import ApClassroomHeader from './ApClassroomHeader';
import ApClassroomFooter from './ApClassroomFooter';
import ApClassroomQuestionView from './ApClassroomQuestionView';
import ApClassroomNavModal from './ApClassroomNavModal';
import ApClassroomReviewPage from './ApClassroomReviewPage';
import '@/css/ap-classroom.css';

function buildQuizTitle(config, moduleName) {
  if (config?.quizTitle) return config.quizTitle;
  if (moduleName) return `${moduleName} Progress Check: MCQ`;
  return 'Practice Quiz: MCQ';
}

export default function ApClassroomQuizRunner({
  questions,
  config = {},
  onComplete,
  onExit,
  moduleName,
}) {
  const sessionStartRef = useRef(Date.now());
  const title = buildQuizTitle(config, moduleName);

  const {
    index,
    q,
    answersByIndex,
    flagged,
    navModalOpen,
    reviewScreen,
    getSelected,
    getCrossedOutForIndex,
    isFlagged,
    select,
    toggleFlag,
    toggleCrossout,
    undoCrossout,
    jump,
    goBack,
    advance,
    openReview,
    closeReview,
    toggleNavModal,
    closeNavModal,
    submit,
  } = useQuizSessionState(questions, { onComplete, sessionStartRef });

  const handleSelect = useCallback((option) => {
    select(option);
  }, [select]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (reviewScreen && e.key === 'Escape') {
        closeReview();
        return;
      }
      if (navModalOpen && e.key === 'Escape') {
        closeNavModal();
        return;
      }
      if (reviewScreen || navModalOpen || !q) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFlag();
        return;
      }

      const options = q.options ?? [];
      const letterIndex = e.key.toUpperCase().charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex < options.length) {
        e.preventDefault();
        handleSelect(options[letterIndex]);
      }

      if (e.key === 'ArrowLeft') goBack();
      if (e.key === 'ArrowRight') advance();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    reviewScreen,
    navModalOpen,
    q,
    toggleFlag,
    handleSelect,
    goBack,
    advance,
    closeReview,
    closeNavModal,
  ]);

  if (!questions.length) {
    return (
      <div className="ap-classroom-root">
        <div className="ap-classroom-main-inner">
          <p>No questions loaded yet.</p>
          {onExit && (
            <button type="button" className="ap-classroom-btn ap-classroom-btn-primary" onClick={onExit}>
              Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ap-classroom-root" aria-label="Simulated AP Classroom interface">
      <div className="ap-classroom-shell">
        <ApClassroomHeader title={title} onExit={onExit} />
        <hr className="ap-classroom-separator" />

        <main className="ap-classroom-main">
          {reviewScreen ? (
            <ApClassroomReviewPage
              title={title}
              total={questions.length}
              answersByIndex={answersByIndex}
              flagged={flagged}
              onJump={jump}
            />
          ) : (
            <div className="ap-classroom-main-inner">
              {q && (
                <ApClassroomQuestionView
                  question={q}
                  questionNumber={index + 1}
                  selected={getSelected()}
                  flagged={isFlagged()}
                  crossedOut={getCrossedOutForIndex(index)}
                  onSelect={handleSelect}
                  onToggleFlag={() => toggleFlag()}
                  onToggleCrossout={(optIdx) => toggleCrossout(optIdx)}
                  onUndoCrossout={() => undoCrossout()}
                />
              )}
            </div>
          )}
        </main>

        <hr className="ap-classroom-separator" />

        <ApClassroomFooter
          variant={reviewScreen ? 'review' : 'question'}
          currentIndex={index}
          total={questions.length}
          navModalOpen={navModalOpen}
          onToggleNav={toggleNavModal}
          onBack={reviewScreen ? closeReview : goBack}
          onNext={advance}
          onSubmit={submit}
          canGoBack={reviewScreen ? true : index > 0}
          canGoNext={!reviewScreen}
        />
      </div>

      {navModalOpen && !reviewScreen && (
        <ApClassroomNavModal
          title={title}
          total={questions.length}
          currentIndex={index}
          answersByIndex={answersByIndex}
          flagged={flagged}
          onClose={closeNavModal}
          onJump={jump}
          onGoToReview={openReview}
        />
      )}
    </div>
  );
}
