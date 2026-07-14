import { formatConfidenceBadge, formatTrendBadge } from '@/utils/failures/formatFailureCopy';

export default function FailureProfileTrendBadge({ confidence, trend }) {
  const confidenceLabel = formatConfidenceBadge(confidence);
  const trendLabel = formatTrendBadge(trend);

  if (!confidenceLabel && !trendLabel) return null;

  return (
    <div className="failure-profile-badges">
      {confidenceLabel && (
        <span className={`failure-mode-badge failure-mode-badge--${confidence}`}>
          {confidenceLabel}
        </span>
      )}
      {trendLabel && (
        <span className={`failure-mode-badge failure-mode-badge--trend-${trend}`}>
          {trendLabel}
        </span>
      )}
    </div>
  );
}
