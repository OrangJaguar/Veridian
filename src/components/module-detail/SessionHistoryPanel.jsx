import { useState } from 'react';
import { format } from 'date-fns';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';
import ExpandToggle from '@/components/shared/ExpandToggle';

function sessionOutcome(s) {
  if (s.score != null) return `${Math.round(s.score)}%`;
  if (s.durationSec != null) return `${Math.round(s.durationSec / 60)} min`;
  return null;
}

export default function SessionHistoryPanel({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  const moduleSessions = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

  return (
    <section className="module-panel module-session-history">
      <ExpandToggle
        expanded={open}
        onClick={() => setOpen(!open)}
        className="module-panel-toggle"
      >
        Show session history
      </ExpandToggle>
      {open && (
        <div className="module-panel-body">
          {moduleSessions.length === 0 ? (
            <p className="journeys-status">No completed sessions yet.</p>
          ) : (
            <ul className="module-session-card-list">
              {moduleSessions.map((s) => {
                const outcome = sessionOutcome(s);
                return (
                  <li key={s.sessionId ?? s.id} className="module-session-card">
                    <div className="module-session-card-main">
                      <span className="module-session-card-name">
                        {ACTIVITY_LABELS[s.activityType] ?? s.activityType}
                      </span>
                      <span className="module-session-card-date">
                        {s.startedAt ? format(new Date(s.startedAt), 'MMM d, h:mm a') : '—'}
                      </span>
                    </div>
                    {outcome && (
                      <span className="module-session-card-outcome">{outcome}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
