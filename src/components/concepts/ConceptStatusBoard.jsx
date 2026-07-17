import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLaunchDueItem } from '@/hooks/home/useLaunchDueItem';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { CONCEPT_STATUS } from '@/utils/study/buildConceptStatusBoard';
import ConceptRelationGraph from '@/components/concepts/ConceptRelationGraph';

const STATUS_LABELS = {
  [CONCEPT_STATUS.unseen]: 'Unseen',
  [CONCEPT_STATUS.developing]: 'Developing',
  [CONCEPT_STATUS.fragile]: 'Fragile',
  [CONCEPT_STATUS.solid]: 'Solid',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: CONCEPT_STATUS.fragile, label: 'Fragile' },
  { id: CONCEPT_STATUS.developing, label: 'Developing' },
  { id: CONCEPT_STATUS.solid, label: 'Solid' },
  { id: CONCEPT_STATUS.unseen, label: 'Unseen' },
];

export default function ConceptStatusBoard({
  rows = [],
  relations = [],
  activities = [],
  journeyId,
  moduleId,
  moduleName,
  showGraph = true,
}) {
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const launch = useLaunchDueItem();

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const selected = rows.find((r) => r.conceptId === selectedId) ?? null;

  const handleStudy = async (row) => {
    const activity = (activities ?? []).find(
      (a) => a.moduleId === (row.moduleId ?? moduleId)
        && a.type === row.recommendedActivityType
        && a.status !== 'failed',
    ) ?? (activities ?? []).find(
      (a) => a.moduleId === (row.moduleId ?? moduleId) && a.type === 'practiceQuiz',
    );
    if (!activity) return;
    await launch({
      journeyId: row.journeyId ?? journeyId,
      moduleId: row.moduleId ?? moduleId,
      moduleName,
      activityId: activity.activityId,
      activityType: activity.type,
      estimatedMin: 15,
      quizConfig: activity.type === 'practiceQuiz'
        ? { questionCount: 5, focusPreset: 'weakSpots' }
        : null,
      flashcardMode: activity.type === 'flashcardSet' ? 'due' : null,
      reason: `Focus on ${row.term}`,
    });
  };

  if (!rows.length) {
    return (
      <div className="concept-board-empty">
        <p>No concepts yet for this module.</p>
      </div>
    );
  }

  return (
    <div className="concept-status-board">
      <div className="concept-board-filters" role="tablist" aria-label="Concept status filter">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`concept-board-filter${filter === f.id ? ' is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showGraph && (
        <ConceptRelationGraph
          rows={filtered}
          relations={relations}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <ul className="concept-board-list">
        {filtered.map((row) => (
          <li key={row.conceptId}>
            <button
              type="button"
              className={`concept-board-card concept-board-card--${row.status}${selectedId === row.conceptId ? ' is-selected' : ''}`}
              onClick={() => setSelectedId(row.conceptId)}
            >
              <div className="concept-board-card-top">
                <span className="concept-board-term">{row.term}</span>
                <span className={`concept-status-pill concept-status-pill--${row.status}`}>
                  {STATUS_LABELS[row.status]}
                </span>
              </div>
              {row.definition && (
                <p className="concept-board-definition">{row.definition}</p>
              )}
              <div className="concept-board-meta">
                {row.attempts > 0 ? (
                  <span>{row.accuracy}% of {row.attempts}</span>
                ) : (
                  <span>No quiz attempts yet</span>
                )}
                {row.dueCards > 0 && <span>· {row.dueCards} due</span>}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div className="concept-board-detail" role="region" aria-label={`${selected.term} details`}>
          <h3 className="concept-board-detail-title">{selected.term}</h3>
          {selected.definition && (
            <p className="concept-board-detail-body">{selected.definition}</p>
          )}
          {selected.failureModes?.length > 0 && (
            <p className="concept-board-detail-modes">
              Patterns:{' '}
              {selected.failureModes
                .map((id) => getFailureModeMeta(id)?.title ?? id)
                .join(', ')}
            </p>
          )}
          <div className="concept-board-detail-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleStudy(selected)}
            >
              Study this concept
            </button>
            {moduleId && journeyId && (
              <Link
                className="btn btn-secondary"
                to={`/journeys/${journeyId}/modules/${moduleId}`}
              >
                Open module
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
