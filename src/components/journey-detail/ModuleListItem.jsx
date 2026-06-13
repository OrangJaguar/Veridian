import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import PracticeQuizStartButton from '@/components/study/quiz/PracticeQuizStartButton';
import {
  getActivityDisplayName,
  getActivityActionLabel,
  getActivityStatusNote,
} from '@/utils/study/activityUi';
import { isLegacyGeneratingActivity } from '@/utils/study/activityContent';
import { stageActivityTypes } from '@/components/module-detail/ActivityRow';

const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

function orderModuleActivities(activities, moduleId) {
  const moduleActs = activities.filter((a) => a.moduleId === moduleId);
  const decks = moduleActs.filter((a) => a.type === 'flashcardSet');
  const ordered = [];
  for (const stage of ['A', 'B', 'C']) {
    for (const type of stageActivityTypes(stage)) {
      if (type === 'flashcardSet') {
        ordered.push(...decks);
      } else {
        const act = moduleActs.find((a) => a.type === type);
        if (act) ordered.push(act);
      }
    }
  }
  return ordered;
}

function DrawerActivityRow({ activity, journeyId, moduleId, cardsByActivity }) {
  const launchStudy = useLaunchStudy();
  const cardCount = (cardsByActivity?.[activity.activityId] ?? []).length;
  const actionLabel = getActivityActionLabel(activity);

  const handleLaunch = () => {
    launchStudy({ journeyId, activity, moduleId });
  };

  return (
    <div className="journey-module-drawer-row">
      <div className="journey-module-drawer-row-main">
        <span className="journey-module-drawer-name">{getActivityDisplayName(activity)}</span>
        <span className="journey-module-drawer-status">{getActivityStatusNote(activity, cardCount)}</span>
      </div>
      {activity.type === 'practiceQuiz' ? (
        <PracticeQuizStartButton
          activity={activity}
          journeyId={journeyId}
          moduleId={moduleId}
          disabled={isLegacyGeneratingActivity(activity)}
        >
          {actionLabel}
        </PracticeQuizStartButton>
      ) : activity.type === 'flashcardSet' ? (
        <div className="journey-module-drawer-actions">
          <Link
            to={`/journeys/${journeyId}/modules/${moduleId}/decks/${activity.activityId}/edit`}
            className="btn btn-secondary btn-sm"
          >
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isLegacyGeneratingActivity(activity)}
            onClick={handleLaunch}
          >
            {actionLabel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={isLegacyGeneratingActivity(activity)}
          onClick={handleLaunch}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function ModuleListItem({
  journeyId,
  module: mod,
  activities = [],
  cardsByActivity = {},
  expanded,
  onToggle,
}) {
  const mastery = mod.masteryScore ?? 0;
  const stage = mod.stage || 'A';
  const moduleActivities = orderModuleActivities(activities, mod.moduleId);

  return (
    <li className={`journey-module-card${expanded ? ' expanded' : ''}`}>
      <button
        type="button"
        className="journey-module-card-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="journey-module-card-main">
          <strong className="journey-module-card-name">{mod.name}</strong>
          {mod.description && (
            <span className="journey-module-card-desc">{mod.description}</span>
          )}
        </div>
        <div className="journey-module-card-right">
          <span className={`journey-module-stage stage-${stage}`}>
            Stage {stage} · {STAGE_LABELS[stage]}
          </span>
          <span className="journey-module-card-mastery">{mastery}%</span>
          <ChevronDown
            className={`journey-module-chevron${expanded ? ' expanded' : ''}`}
            size={18}
            strokeWidth={2}
            aria-hidden
          />
        </div>
      </button>

      {expanded && (
        <div className="journey-module-drawer">
          {moduleActivities.length === 0 ? (
            <p className="journeys-status">No activities yet.</p>
          ) : (
            <div className="journey-module-drawer-list">
              {moduleActivities.map((act) => (
                <DrawerActivityRow
                  key={act.activityId ?? act.id}
                  activity={act}
                  journeyId={journeyId}
                  moduleId={mod.moduleId}
                  cardsByActivity={cardsByActivity}
                />
              ))}
            </div>
          )}
          <div className="journey-module-drawer-footer">
            <Link
              to={`/journeys/${journeyId}/modules/${mod.moduleId}`}
              className="journey-module-drawer-link"
            >
              Go to Module →
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}
