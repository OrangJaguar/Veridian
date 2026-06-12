import { createPortal } from 'react-dom';

export default function QuizTimeNotice({ message }) {
  if (!message) return null;

  return createPortal(
    <div className="quiz-time-notice" role="status">
      <div className="quiz-time-notice-bubble">{message}</div>
    </div>,
    document.body,
  );
}
