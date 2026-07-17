import { useLaunchDueItem, actionVerbForType } from '@/hooks/home/useLaunchDueItem';
import { formatDueItemPresentation } from '@/utils/dueToday/formatDueItemPresentation';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import PlanAssignmentControls from '@/components/planner/PlanAssignmentControls';

export default function FocusNowCard({ item }) {
  const launch = useLaunchDueItem();
  const verb = actionVerbForType(item.activityType);
  const { activityLabel, reasonLine, contextLine } = formatDueItemPresentation(item);
  const modeMeta = item.primaryMode ? getFailureModeMeta(item.primaryMode) : null;

  return (
    <article className="home-focus-card">
      <p className="home-focus-eyebrow">Focus now</p>
      <h3 className="home-focus-activity">{activityLabel}</h3>
      <p className="home-focus-context">
        {reasonLine || item.actionLabel}
        {contextLine && (
          <>
            <br />
            <span className="home-focus-journey">{contextLine}</span>
          </>
        )}
      </p>
      {modeMeta && (
        <p className="home-focus-why-mode">Why: {modeMeta.title} pattern</p>
      )}
      {item.planAssignment && (
        <PlanAssignmentControls assignment={item} compact />
      )}
      <div className="home-focus-footer">
        <span className="home-focus-time">~{item.estimatedMin} min</span>
        <button type="button" className="btn btn-primary home-focus-btn" onClick={() => launch(item)}>
          {verb}
        </button>
      </div>
    </article>
  );
}
