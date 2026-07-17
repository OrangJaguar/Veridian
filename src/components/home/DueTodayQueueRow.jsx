import { useLaunchDueItem, actionVerbForType } from '@/hooks/home/useLaunchDueItem';
import { formatDueItemPresentation } from '@/utils/dueToday/formatDueItemPresentation';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import PlanAssignmentControls from '@/components/planner/PlanAssignmentControls';

export default function DueTodayQueueRow({ item }) {
  const launch = useLaunchDueItem();
  const verb = actionVerbForType(item.activityType);
  const { activityLabel, reasonLine, contextLine } = formatDueItemPresentation(item);
  const modeMeta = item.primaryMode ? getFailureModeMeta(item.primaryMode) : null;

  return (
    <div className="home-queue-row">
      <div className="home-queue-row-main">
        <span className="home-queue-row-activity">{activityLabel}</span>
        <span className="home-queue-row-context">
          {reasonLine || item.actionLabel}
          {contextLine && <> · {contextLine}</>}
        </span>
        {modeMeta && (
          <span className="home-queue-row-why">Why: {modeMeta.title}</span>
        )}
        {item.planAssignment && (
          <PlanAssignmentControls assignment={item} compact />
        )}
      </div>
      <div className="home-queue-row-meta">
        <span className="home-queue-row-time">~{item.estimatedMin} min</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => launch(item)}>
          {verb}
        </button>
      </div>
    </div>
  );
}
