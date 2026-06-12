import { useLaunchDueItem, actionVerbForType } from '@/hooks/home/useLaunchDueItem';

export default function FocusNowCard({ item }) {
  const launch = useLaunchDueItem();
  const verb = actionVerbForType(item.activityType);

  return (
    <article className="home-focus-card">
      <p className="home-focus-eyebrow">Focus now</p>
      <h3 className="home-focus-activity">{item.activityLabel}</h3>
      <p className="home-focus-context">
        {item.journeyTitle}
        {item.moduleName && <> · {item.moduleName}</>}
      </p>
      {item.actionLabel && (
        <p className="home-focus-reason">{item.actionLabel}</p>
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
