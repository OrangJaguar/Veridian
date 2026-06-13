import { Link } from 'react-router-dom';
import { formatStudyTime } from '@/utils/study/feedback';

const STAGE_LABELS = {
  A: 'Stage A — Learn',
  B: 'Stage B — Practice',
};

function formatCorrectAnswer(q) {
  if (Array.isArray(q.correctAnswer)) return q.correctAnswer.join(', ');
  return String(q.correctAnswer ?? '');
}

export default function DiagnosticSummary({
  questions,
  answers,
  totalTimeSec,
  journeyTitle,
  moduleResults,
  journeyId,
}) {
  const answerByQuestionId = {};
  for (const a of answers) {
    if (a?.questionId) answerByQuestionId[a.questionId] = a;
  }

  const graded = answers.filter((a) => a && !a.skipped);
  const correctCount = graded.filter((a) => a.correct).length;
  const accuracy = graded.length ? Math.round((correctCount / graded.length) * 100) : 0;

  return (
    <main className="study-mode-view session-summary-view diagnostic-summary-view">
      <header className="diagnostic-summary-header">
        <h2 className="diagnostic-summary-title">Diagnostic complete</h2>
        {journeyTitle && (
          <p className="diagnostic-summary-subtitle">{journeyTitle}</p>
        )}
      </header>

      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Overall accuracy</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{formatStudyTime(totalTimeSec)}</span>
          <span className="stat-label">Total time</span>
        </div>
      </div>

      <section className="diagnostic-module-results" aria-label="Module placement">
        <h3 className="diagnostic-section-title">Module placement</h3>
        <ul className="diagnostic-module-list">
          {moduleResults.map((result) => (
            <li key={result.moduleId} className="diagnostic-module-result">
              <div className="diagnostic-module-result-head">
                <span className="diagnostic-module-name">{result.moduleName}</span>
                <span className={`diagnostic-stage-badge stage-${result.assignedStage.toLowerCase()}`}>
                  {STAGE_LABELS[result.assignedStage] ?? result.assignedStage}
                </span>
              </div>
              <p className="diagnostic-module-score">
                {result.correct}/{result.total} correct
                {' · '}
                {result.accuracy}% initial mastery
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="review-list">
        {questions.map((q, idx) => {
          const ans = answerByQuestionId[q.id];
          const isCorrect = ans?.correct === true;
          const selected = ans?.response != null ? String(ans.response) : 'Skipped';
          const correct = formatCorrectAnswer(q);
          const timeLabel = ans?.timeSec != null ? `${ans.timeSec.toFixed(1)}s` : '—';

          return (
            <div
              key={q.id}
              className={`review-item ${isCorrect ? 'review-correct' : 'review-wrong'}`}
            >
              <div className="review-meta-bar">
                <div className="review-q">{idx + 1}. {q.stem}</div>
                <div className="review-tta">{timeLabel}</div>
              </div>
              <div className="review-a">
                Selected: {selected}
                {!isCorrect && (
                  <>
                    <br />
                    Correct: {correct}
                  </>
                )}
                {q.explanation && (
                  <>
                    <br />
                    <span className="diagnostic-explanation">{q.explanation}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-row summary-actions">
        <Link to={`/journeys/${journeyId}`} className="btn btn-primary">
          Continue to journey
        </Link>
      </div>
    </main>
  );
}
