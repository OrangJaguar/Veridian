import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import FailureModeIcon from '@/components/failures/FailureModeIcon';
import { formatConfidenceBadge } from '@/utils/failures/formatFailureCopy';

const STATUS_LABELS = {
  solid: 'Solid',
  shaky: 'Shaky',
  needs_work: 'Needs work',
  skipped: 'Skipped',
};

export function ConceptDebriefSection({ conceptResults = [] }) {
  if (!conceptResults.length) return null;

  return (
    <section className="quiz-debrief-section" aria-label="Concept breakdown">
      <h3 className="quiz-debrief-title">Concepts in this quiz</h3>
      <ul className="quiz-concept-debrief-list">
        {conceptResults.map((row) => (
          <li key={row.conceptId} className={`quiz-concept-debrief-item quiz-concept-debrief-item--${row.status}`}>
            <div className="quiz-concept-debrief-main">
              <span className="quiz-concept-debrief-term">{row.term}</span>
              <span className={`quiz-concept-status quiz-concept-status--${row.status}`}>
                {STATUS_LABELS[row.status] ?? row.status}
              </span>
            </div>
            <div className="quiz-concept-debrief-meta">
              {row.attempts > 0 ? (
                <span>{row.correct}/{row.attempts} correct ({row.accuracy}%)</span>
              ) : (
                <span>No answered items</span>
              )}
              {row.avgTimeSec != null && (
                <span>· avg {row.avgTimeSec}s</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrapDebriefSection({ trapDebrief = null }) {
  if (!trapDebrief) return null;

  if (trapDebrief.suppressed && !trapDebrief.sessionHits?.length && !trapDebrief.cumulativePrimaryMode) {
    return (
      <section className="quiz-debrief-section" aria-label="Learning traps">
        <h3 className="quiz-debrief-title">Learning traps</h3>
        <p className="quiz-debrief-empty">{trapDebrief.suppressionReason}</p>
      </section>
    );
  }

  const sessionPrimaryMeta = trapDebrief.primaryMode
    ? getFailureModeMeta(trapDebrief.primaryMode)
    : null;
  const cumulativeMeta = trapDebrief.cumulativePrimaryMode
    ? getFailureModeMeta(trapDebrief.cumulativePrimaryMode)
    : null;

  return (
    <section className="quiz-debrief-section" aria-label="Learning traps">
      <h3 className="quiz-debrief-title">Learning traps</h3>

      {trapDebrief.sessionHits?.length > 0 && (
        <ul className="quiz-trap-hit-list">
          {trapDebrief.sessionHits.map((hit) => {
            const meta = getFailureModeMeta(hit.modeId);
            return (
              <li key={hit.modeId} className="quiz-trap-hit-item">
                <FailureModeIcon modeId={hit.modeId} size={16} />
                <div className="quiz-trap-hit-text">
                  <span className="quiz-trap-hit-title">{meta?.title ?? hit.modeId}</span>
                  <span className="quiz-trap-hit-meta">
                    {hit.hits} signal{hit.hits === 1 ? '' : 's'} this session
                    {hit.conceptIds?.length
                      ? ` · ${hit.conceptIds.length} concept${hit.conceptIds.length === 1 ? '' : 's'}`
                      : ''}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {sessionPrimaryMeta && (
        <p className="quiz-trap-summary">
          This session: early {sessionPrimaryMeta.title.toLowerCase()} signal.
        </p>
      )}

      {!sessionPrimaryMeta && trapDebrief.suppressionReason && (
        <p className="quiz-debrief-empty">{trapDebrief.suppressionReason}</p>
      )}

      {cumulativeMeta && (
        <p className="quiz-trap-cumulative">
          Module pattern: {cumulativeMeta.title}
          {trapDebrief.cumulativeConfidence
            ? ` (${formatConfidenceBadge(trapDebrief.cumulativeConfidence) ?? trapDebrief.cumulativeConfidence})`
            : ''}
        </p>
      )}

      {trapDebrief.advice && (
        <p className="quiz-trap-advice">{trapDebrief.advice}</p>
      )}
    </section>
  );
}

export function NextActivitySection({
  nextActivity = null,
  onLaunch,
  launching = false,
  onSchedule,
  scheduling = false,
}) {
  if (!nextActivity) return null;

  return (
    <section className="quiz-next-activity" aria-label="Recommended next step">
      <h3 className="quiz-debrief-title">Do this next</h3>
      <p className="quiz-next-activity-reason">{nextActivity.reason}</p>
      <div className="quiz-next-activity-row">
        <div className="quiz-next-activity-meta">
          <span className="quiz-next-activity-label">
            {nextActivity.label ?? nextActivity.activityType}
          </span>
          {nextActivity.estimatedMin != null && (
            <span className="quiz-next-activity-time">~{nextActivity.estimatedMin} min</span>
          )}
        </div>
        <div className="quiz-next-activity-actions">
          {onSchedule && nextActivity.activityId && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={scheduling || launching}
              onClick={() => onSchedule(nextActivity)}
            >
              {scheduling ? 'Scheduling…' : 'Schedule for tomorrow'}
            </button>
          )}
          {onLaunch && nextActivity.activityId && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={launching || scheduling}
              onClick={() => onLaunch(nextActivity)}
            >
              {launching ? 'Starting…' : 'Start'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
