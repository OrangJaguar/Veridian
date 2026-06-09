import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';

export default function JourneyInsightsPanel({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  const recent = sessions.slice(0, 10);

  const trends = useMemo(() => {
    const scored = sessions.filter((s) => s.status === 'completed' && s.score != null);
    if (scored.length === 0) return null;

    const byType = {};
    scored.forEach((s) => {
      const type = s.activityType;
      if (!byType[type]) byType[type] = { total: 0, count: 0, last: null };
      byType[type].total += s.score;
      byType[type].count += 1;
      if (!byType[type].last || s.startedAt > byType[type].last) {
        byType[type].last = s.startedAt;
      }
    });

    const overallAvg = Math.round(scored.reduce((a, s) => a + s.score, 0) / scored.length);
    const typeAvgs = Object.entries(byType).map(([type, v]) => ({
      type,
      avg: Math.round(v.total / v.count),
      count: v.count,
      last: v.last,
    }));

    return { overallAvg, typeAvgs, totalSessions: scored.length };
  }, [sessions]);

  return (
    <section className="journey-insights">
      <button
        type="button"
        className="journey-insights-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>Journey Insights</span>
        <span className="journey-insights-chevron">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="journey-insights-body">
          {trends && (
            <div className="journey-insights-trends">
              <div className="journey-insights-stat">
                <span className="journey-insights-stat-value">{trends.overallAvg}%</span>
                <span className="journey-insights-stat-label">Avg accuracy</span>
              </div>
              <div className="journey-insights-stat">
                <span className="journey-insights-stat-value">{trends.totalSessions}</span>
                <span className="journey-insights-stat-label">Sessions</span>
              </div>
            </div>
          )}
          {trends?.typeAvgs.length > 0 && (
            <ul className="journey-insights-type-list">
              {trends.typeAvgs.map(({ type, avg, count }) => (
                <li key={type}>
                  <span>{ACTIVITY_LABELS[type] ?? type}</span>
                  <span>{avg}% avg</span>
                  <span className="journey-insights-type-count">{count}×</span>
                </li>
              ))}
            </ul>
          )}
          {recent.length === 0 ? (
            <p className="journeys-status">No sessions yet.</p>
          ) : (
            <ul className="journey-insights-list">
              {recent.map((s) => (
                <li key={s.sessionId ?? s.id}>
                  <span className="journey-insights-type">{ACTIVITY_LABELS[s.activityType] ?? s.activityType}</span>
                  <span className="journey-insights-date">
                    {s.startedAt ? format(new Date(s.startedAt), 'MMM d, h:mm a') : '—'}
                  </span>
                  {s.score != null && (
                    <span className="journey-insights-score">{Math.round(s.score)}%</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
