import ActivityInfoTooltip from '@/components/study/ActivityInfoTooltip';

export default function ActivityLabelWithTooltip({ activityType, label, className = '' }) {
  return (
    <span className={`activity-label-with-tooltip${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <ActivityInfoTooltip activityType={activityType} />
    </span>
  );
}
