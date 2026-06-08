import { useState } from 'react';
import { format } from 'date-fns';

export default function SessionHistoryPanel({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  const moduleSessions = sessions.filter((s) => s.status === 'completed');

  return (
    <section className="module-panel">
      <button
        type="button"
        className="module-panel-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>Session History</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="module-panel-body">
          {moduleSessions.length === 0 ? (
            <p className="journeys-status">No completed sessions yet.</p>
          ) : (
            <ul className="module-session-list">
              {moduleSessions.map((s) => (
                <li key={s.sessionId ?? s.id}>
                  <span>{s.activityType}</span>
                  <span>{s.startedAt ? format(new Date(s.startedAt), 'MMM d, yyyy') : '—'}</span>
                  {s.score != null && <span>{Math.round(s.score)}%</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
