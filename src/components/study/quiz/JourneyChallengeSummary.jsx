import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatStudyTime } from '@/utils/study/feedback';

function barColor(accuracy) {
  if (accuracy >= 75) return 'good';
  if (accuracy >= 50) return 'mid';
  return 'bad';
}

export default function JourneyChallengeSummary({
  questions,
  answers,
  modules,
  perModuleAccuracy,
  perModuleMissedConcept,
  totalTimeSec,
  timeRemainingSec,
  challengeDeltas = [],
  planReweighted,
  focusModules = [],
  returnHref,
}) {
  const [reviewOpen, setReviewOpen] = useState(false);

  const graded = answers.filter((a) => a && !a.skipped);
  const correctCount = graded.filter((a) => a.correct).length;
  const accuracy = graded.length ? Math.round((correctCount / graded.length) * 100) : 0;

  const answerByQuestionId = {};
  for (const a of answers) {
    if (a?.questionId) answerByQuestionId[a.questionId] = a;
  }

  const breakdown = modules
    .map((m) => ({
      moduleId: m.moduleId,
      name: m.name,
      accuracy: perModuleAccuracy[m.moduleId],
      missed: perModuleMissedConcept[m.moduleId],
    }))
    .filter((row) => row.accuracy != null)
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <main className="study-mode-view session-summary-view journey-challenge-summary">
      <h1 className="journey-challenge-summary-title">Challenge complete</h1>

      <div className="journey-challenge-summary-stats">
        <div className="stat-box stat-box-large">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
        <div className="journey-challenge-summary-side">
          <div className="stat-box">
            <span className="stat-value">{formatStudyTime(totalTimeSec ?? 0)}</span>
            <span className="stat-label">Total time</span>
          </div>
          {timeRemainingSec != null && timeRemainingSec > 0 && (
            <div className="stat-box">
              <span className="stat-value">{formatStudyTime(timeRemainingSec)}</span>
              <span className="stat-label">Time left</span>
            </div>
          )}
        </div>
      </div>

      {breakdown.length > 0 && (
        <section className="journey-challenge-breakdown">
          <h2 className="journey-challenge-section-title">Module breakdown</h2>
          <ul className="module-breakdown-list">
            {breakdown.map((row) => (
              <li key={row.moduleId} className="module-breakdown-row">
                <div className="module-breakdown-top">
                  <span className="module-breakdown-name">{row.name}</span>
                  <span className="module-breakdown-pct">{row.accuracy}%</span>
                </div>
                <div className={`module-accuracy-bar ${barColor(row.accuracy)}`}>
                  <div className="module-accuracy-fill" style={{ width: `${row.accuracy}%` }} />
                </div>
                {row.missed && (
                  <p className="module-breakdown-missed">Most missed: {row.missed}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {challengeDeltas.length > 0 && (
        <section className="journey-challenge-deltas">
          <h2 className="journey-challenge-section-title">Since last challenge</h2>
          <ul className="challenge-delta-list">
            {challengeDeltas.map((d) => (
              <li key={d.moduleId} className="challenge-delta">
                {d.delta > 0 ? '+' : ''}{d.delta}% on {d.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {planReweighted && focusModules.length > 0 && (
        <p className="plan-callout">
          Your weekly plan has been updated — {focusModules.join(', ')}
          {focusModules.length === 1 ? ' gets' : ' get'} extra focus this week.
        </p>
      )}

      <div className="summary-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setReviewOpen(!reviewOpen)}
        >
          {reviewOpen ? 'Hide review' : 'Review questions'}
        </button>
        <Link to={returnHref} className="btn btn-primary btn-sm">Done</Link>
      </div>

      {reviewOpen && (
        <div className="review-list">
          {questions.map((q, idx) => {
            const ans = answerByQuestionId[q.id];
            const isCorrect = ans?.correct === true;
            return (
              <div key={q.id} className={`review-item${isCorrect ? ' correct' : ' wrong'}`}>
                <p className="review-item-num">Q{idx + 1}</p>
                <p className="review-item-stem">{q.stem}</p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
