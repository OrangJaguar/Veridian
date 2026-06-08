import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

function healthDot(mastery) {
  if (mastery >= 70) return 'green';
  if (mastery >= 40) return 'yellow';
  return 'red';
}

export default function ModuleListItem({ journeyId, module: mod, sessions = [] }) {
  const [expanded, setExpanded] = useState(false);
  const mastery = mod.masteryScore ?? 0;
  const stage = mod.stage || 'A';

  const moduleSessions = sessions
    .filter((s) => s.moduleId === mod.moduleId && s.status === 'completed')
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  const lastStudied = moduleSessions[0]?.startedAt;

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info('Study sessions launch in Phase 6');
  };

  return (
    <li className={`journey-module-item${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="journey-module-item-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="journey-module-main">
          <strong>{mod.name}</strong>
          {mod.description && <span>{mod.description}</span>}
        </div>
        <div className="journey-module-meta">
          <span className={`journey-module-health health-${healthDot(mastery)}`} aria-hidden />
          <span className={`journey-module-stage stage-${stage}`}>
            Stage {stage} · {STAGE_LABELS[stage]}
          </span>
          <span className="journey-module-mastery">{mastery}%</span>
        </div>
      </button>

      <div className="journey-module-actions">
        <span className="journey-module-last">
          {lastStudied
            ? `Last studied ${formatDistanceToNow(new Date(lastStudied), { addSuffix: true })}`
            : 'Not studied yet'}
        </span>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleStart}>
          Start Session
        </button>
        <Link
          to={`/journeys/${journeyId}/modules/${mod.moduleId}`}
          className="btn btn-secondary btn-sm"
          onClick={(e) => e.stopPropagation()}
        >
          Go to Module
        </Link>
      </div>
    </li>
  );
}
