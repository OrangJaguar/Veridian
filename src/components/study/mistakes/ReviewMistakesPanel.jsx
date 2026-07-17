import { useState } from 'react';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useReviewMistakes } from '@/hooks/useReviewMistakes';
import LatexRenderer from '@/components/shared/LatexRenderer';
import { formatDistanceToNow } from 'date-fns';

function formatAnswer(val) {
  if (val == null) return 'Skipped';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k} → ${v}`).join('; ');
  }
  return String(val);
}

export default function ReviewMistakesPanel() {
  const { data: journeys = [] } = useJourneys({ archived: false });
  const [filterJourney, setFilterJourney] = useState('');
  const { mistakes, isLoading, isEmpty } = useReviewMistakes(filterJourney || undefined);

  const journeyMap = {};
  for (const j of journeys) journeyMap[j.journeyId] = j.title;

  return (
    <div className="mistakes-panel">
      <header className="mistakes-header">
        <h1 className="mistakes-title">Review Mistakes</h1>
        <select
          className="mistakes-filter"
          value={filterJourney}
          onChange={(e) => setFilterJourney(e.target.value)}
        >
          <option value="">All journeys</option>
          {journeys.map((j) => (
            <option key={j.journeyId} value={j.journeyId}>{j.title}</option>
          ))}
        </select>
      </header>

      {isLoading && <p className="mistakes-loading">Loading…</p>}

      {isEmpty && (
        <div className="mistakes-empty">
          <p>No mistakes yet — keep studying!</p>
        </div>
      )}

      <div className="mistakes-list">
        {mistakes.map((m, i) => (
          <div key={`${m.stem}-${i}`} className="mistakes-item">
            <div className="mistakes-item-stem">
              <LatexRenderer text={m.stem} />
            </div>
            <div className="mistakes-item-answers">
              <span className="mistakes-answer mistakes-answer--wrong">
                Your answer: <LatexRenderer text={formatAnswer(m.userResponse)} />
              </span>
              <span className="mistakes-answer mistakes-answer--correct">
                Correct: <LatexRenderer text={formatAnswer(m.correctAnswer)} />
              </span>
            </div>
            {m.explanation && (
              <p className="mistakes-item-explanation">
                <LatexRenderer text={m.explanation} />
              </p>
            )}
            <div className="mistakes-item-meta">
              <span>{journeyMap[m.journeyId] ?? 'Unknown journey'}</span>
              {m.timestamp && (
                <span>{formatDistanceToNow(m.timestamp, { addSuffix: true })}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
