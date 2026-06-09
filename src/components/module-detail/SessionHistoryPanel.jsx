import { useState } from 'react';
import { format } from 'date-fns';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';

function summarizeSessionData(session) {
  const data = session.sessionData;
  if (!data) return null;

  switch (session.activityType) {
    case 'practiceQuiz':
    case 'interleavedReview':
    case 'journeyChallenge':
    case 'synthesis':
      return `${data.answers?.length ?? 0} answers · ${data.questions?.length ?? 0} questions`;
    case 'flashcardSet':
      return `${data.reviews?.length ?? 0} cards · Again ${data.counts?.again ?? 0}`;
    case 'learningGuide':
      return `${data.completedSectionIds?.length ?? 0} sections completed`;
    case 'feynman':
      return data.overallConfidenceRating
        ? `Confidence: ${data.overallConfidenceRating}`
        : data.conceptPrompt;
    case 'freeRecall':
      return data.coveragePercent != null
        ? `${data.coveragePercent}% coverage · ${data.hintsUsed ?? 0} hints`
        : null;
    default:
      if (data.cramMode || data.itemsCompleted != null) {
        return `${data.itemsCompleted ?? 0} items completed`;
      }
      return null;
  }
}

export default function SessionHistoryPanel({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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
              {moduleSessions.map((s) => {
                const sid = s.sessionId ?? s.id;
                const summary = summarizeSessionData(s);
                const isExpanded = expandedId === sid;
                return (
                  <li key={sid} className={`module-session-item${isExpanded ? ' expanded' : ''}`}>
                    <button
                      type="button"
                      className="module-session-row"
                      onClick={() => setExpandedId(isExpanded ? null : sid)}
                    >
                      <span>{ACTIVITY_LABELS[s.activityType] ?? s.activityType}</span>
                      <span>{s.startedAt ? format(new Date(s.startedAt), 'MMM d, yyyy') : '—'}</span>
                      {s.score != null && <span>{Math.round(s.score)}%</span>}
                    </button>
                    {isExpanded && (
                      <div className="module-session-detail">
                        {summary && <p>{summary}</p>}
                        {s.outcomeSummary?.nextAction && (
                          <p className="module-session-next">{s.outcomeSummary.nextAction}</p>
                        )}
                        {s.durationSec != null && (
                          <p className="module-session-meta">
                            Duration: {Math.round(s.durationSec / 60)} min
                          </p>
                        )}
                      </div>
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
