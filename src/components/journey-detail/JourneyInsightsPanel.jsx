import { useState } from 'react';
import { format } from 'date-fns';

export default function JourneyInsightsPanel({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  const recent = sessions.slice(0, 10);

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
          {recent.length === 0 ? (
            <p className="journeys-status">No sessions yet.</p>
          ) : (
            <ul className="journey-insights-list">
              {recent.map((s) => (
                <li key={s.sessionId ?? s.id}>
                  <span className="journey-insights-type">{s.activityType}</span>
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
