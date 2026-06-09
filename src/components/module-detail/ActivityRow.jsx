import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { ACTIVITY_LABELS } from '@/utils/studyPlanner';

const STAGE_ACTIVITIES = {
  A: ['learningGuide'],
  B: ['practiceQuiz', 'flashcardSet'],
  C: ['feynman', 'freeRecall', 'synthesis'],
};

export default function ActivityRow({ activity, cardCount = 0, journeyId, moduleId }) {
  const launchStudy = useLaunchStudy();
  const stats = activity.stats ?? {};
  let statLine = '';

  if (activity.type === 'flashcardSet') {
    statLine = `${cardCount} cards · ${stats.dueCount ?? 0} due`;
  } else if (activity.type === 'practiceQuiz') {
    statLine = stats.lastScore != null
      ? `Last score: ${Math.round(stats.lastScore)}%`
      : 'No sessions yet';
  } else if (stats.lastCompletedAt) {
    statLine = 'Completed recently';
  } else if (activity.status === 'notGenerated') {
    statLine = 'Not generated yet';
  } else {
    statLine = stats.totalSessions
      ? `${stats.totalSessions} session${stats.totalSessions === 1 ? '' : 's'}`
      : 'Ready to start';
  }

  const handleLaunch = async () => {
    await launchStudy({
      journeyId,
      activity,
      moduleId,
    });
  };

  return (
    <div className="module-activity-row">
      <div className="module-activity-main">
        <strong>{activity.title ?? ACTIVITY_LABELS[activity.type] ?? activity.type}</strong>
        <span>{statLine}</span>
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={activity.status === 'generating'}
        onClick={handleLaunch}
      >
        {activity.status === 'notGenerated' ? 'Generate' : 'Launch'}
      </button>
    </div>
  );
}

export function stageActivityTypes(stage) {
  return STAGE_ACTIVITIES[stage] ?? STAGE_ACTIVITIES.A;
}

export { STAGE_ACTIVITIES };
