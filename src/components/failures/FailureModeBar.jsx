import { formatRankedBarLabel } from '@/utils/failures/formatFailureCopy';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

export default function FailureModeBar({
  modeId,
  label,
  widthPercent = 0,
  confidence = null,
  metric,
  ariaLabel,
}) {
  const displayLabel = label ?? formatRankedBarLabel(modeId);
  const modeClass = getFailureModeClassName(modeId);
  const barWidth = Math.max(widthPercent > 0 ? 4 : 0, Math.round(widthPercent));

  return (
    <div className={`failure-mode-bar-row ${modeClass}`}>
      <div className="failure-mode-bar-head">
        <span className="failure-mode-bar-label">{displayLabel}</span>
        <span className="failure-mode-bar-metrics">
          {metric != null && <strong>{metric}</strong>}
          {confidence === 'confirmed' && (
            <span className="failure-mode-bar-confidence failure-mode-bar-confidence--confirmed" title="Confirmed pattern" />
          )}
          {confidence === 'emerging' && (
            <span className="failure-mode-bar-confidence failure-mode-bar-confidence--emerging" title="Emerging pattern" />
          )}
        </span>
      </div>
      <div
        className="failure-mode-bar-track"
        role="img"
        aria-label={ariaLabel ?? `${displayLabel}: ${barWidth}% relative strength`}
      >
        <div
          className="failure-mode-bar-fill"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}
