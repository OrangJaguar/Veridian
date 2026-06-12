import { useLaunchDueItem, actionVerbForType } from '@/hooks/home/useLaunchDueItem';

export default function DueTodayQueueRow({ item }) {
  const launch = useLaunchDueItem();
  const verb = actionVerbForType(item.activityType);

  return (
    <div className="home-queue-row">
      <div className="home-queue-row-main">
        <span className="home-queue-row-activity">{item.activityLabel}</span>
        <span className="home-queue-row-context">
          {item.journeyTitle}
          {item.moduleName && <> · {item.moduleName}</>}
        </span>
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
