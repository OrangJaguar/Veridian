import { Link } from 'react-router-dom';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import PracticeQuizStartButton from '@/components/study/quiz/PracticeQuizStartButton';
import {
  getActivityDisplayName,
  getActivityActionLabel,
  getActivityStatusNote,
} from '@/utils/study/activityUi';
import ActivityLabelWithTooltip from '@/components/study/ActivityLabelWithTooltip';
import { isLegacyGeneratingActivity } from '@/utils/study/activityContent';

const STAGE_ACTIVITIES = {
  A: ['learningGuide'],
  B: ['practiceQuiz', 'flashcardSet'],
  C: ['feynman', 'freeRecall'],
};

export default function ActivityRow({ activity, cardCount = 0, journeyId, moduleId, compact = false }) {
  const launchStudy = useLaunchStudy();
  const statLine = getActivityStatusNote(activity, cardCount);
  const actionLabel = getActivityActionLabel(activity);

  const handleLaunch = async () => {
    await launchStudy({
      journeyId,
      activity,
      moduleId,
    });
  };

  return (
    <div className={`module-activity-row${compact ? ' compact' : ''}`}>
      <div className="module-activity-main">
        <strong>
          <ActivityLabelWithTooltip
            activityType={activity.type}
            label={getActivityDisplayName(activity)}
          />
        </strong>
        <span>{statLine}</span>
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
        <div className="module-deck-card-actions">
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

export function stageActivityTypes(stage) {
  return STAGE_ACTIVITIES[stage] ?? STAGE_ACTIVITIES.A;
}

export { STAGE_ACTIVITIES };
