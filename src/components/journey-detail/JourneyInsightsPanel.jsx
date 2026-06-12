import { useState } from 'react';
import { format } from 'date-fns';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';
import ExpandToggle from '@/components/shared/ExpandToggle';

export default function JourneyInsightsPanel({ sessions = [], modules = [] }) {
  const [open, setOpen] = useState(false);

  const completed = sessions
    .filter((s) => s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));

  const moduleName = (moduleId) => {
    if (!moduleId) return 'Journey-wide';
    return modules.find((m) => m.moduleId === moduleId)?.name ?? 'Module';
  };

  return (
    <section className="journey-activity-log detail-section-box">
      <h2 className="journey-detail-section-title">Activity log</h2>
      <ExpandToggle
        expanded={open}
        onClick={() => setOpen(!open)}
        className="journey-activity-log-toggle"
      >
        Show activity log
      </ExpandToggle>

      {open && (
        <div className="journey-activity-log-body">
          {completed.length === 0 ? (
            <p className="journeys-status">No completed sessions yet.</p>
          ) : (
            <ul className="journey-activity-log-list">
              {completed.map((s) => (
                <li key={s.sessionId ?? s.id} className="journey-activity-log-card">
                  <div className="journey-activity-log-card-main">
                    <span className="journey-activity-log-type">
                      {ACTIVITY_LABELS[s.activityType] ?? s.activityType}
                    </span>
                    <span className="journey-activity-log-module">
                      {moduleName(s.moduleId)}
                    </span>
                  </div>
                  <span className="journey-activity-log-date">
                    {s.startedAt ? format(new Date(s.startedAt), 'MMM d, h:mm a') : '—'}
                  </span>
                  {s.score != null && (
                    <span className="journey-activity-log-score">{Math.round(s.score)}%</span>
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
