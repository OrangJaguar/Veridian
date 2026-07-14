/**
 * Cohesive quiz content-source chip (bank vs AI vs quality retry).
 */
export default function QuizContentSourceBadge({ source = null, improving = false }) {
  if (improving) {
    return (
      <span className="quiz-content-source-badge quiz-content-source-badge--improving">
        Improving quality…
      </span>
    );
  }
  if (source === 'questionBank' || source === 'bank') {
    return (
      <span className="quiz-content-source-badge quiz-content-source-badge--bank">
        Using your question bank · No wait
      </span>
    );
  }
  if (source === 'ai' || source === 'generating') {
    return (
      <span className="quiz-content-source-badge quiz-content-source-badge--ai">
        Generating fresh questions
      </span>
    );
  }
  return null;
}
