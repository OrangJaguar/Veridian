import { useLaunchDueItem, actionVerbForType } from '@/hooks/home/useLaunchDueItem';

/**
 * Compact strip when a newly ready journey has Focus work and few completed sessions.
 */
export default function HomeFirstSessionReady({ focusItem, completedSessionCount = 0 }) {
  const launch = useLaunchDueItem();

  if (!focusItem) return null;
  if (completedSessionCount > 2) return null;

  const verb = actionVerbForType(focusItem.activityType);

  return (
    <aside className="home-first-session-ready" aria-label="First session ready">
      <div className="home-first-session-ready-copy">
        <p className="home-first-session-ready-title">Your first session is ready</p>
        <p className="home-first-session-ready-body">
          {focusItem.activityLabel}
          {focusItem.moduleName ? ` · ${focusItem.moduleName}` : ''}
        </p>
      </div>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => launch(focusItem)}
      >
        {verb}
      </button>
    </aside>
  );
}
