import { formatPrescriptionPreview } from '@/utils/failures/formatFailureCopy';

export default function FailureProfilePrescriptionPreview({
  prescription,
  onScrollToActivity,
  onStartPractice,
  ctaLabel = "Start tonight's practice",
  launching = false,
}) {
  const preview = formatPrescriptionPreview(prescription);
  if (!preview) return null;

  const activityType = prescription?.spec?.activityType;

  return (
    <div className="failure-profile-rx-preview">
      <span className="failure-profile-rx-preview-label">Next focus</span>
      <p className="failure-profile-rx-preview-text">{preview}</p>
      <div className="failure-profile-rx-preview-actions">
        {onStartPractice && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onStartPractice}
            disabled={launching}
          >
            {launching ? 'Starting…' : ctaLabel}
          </button>
        )}
        {activityType && onScrollToActivity && (
          <button
            type="button"
            className="failure-profile-rx-preview-link"
            onClick={() => onScrollToActivity(activityType)}
          >
            Show activity →
          </button>
        )}
      </div>
    </div>
  );
}
