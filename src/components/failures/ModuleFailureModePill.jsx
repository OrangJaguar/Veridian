import FailureModeIcon from '@/components/failures/FailureModeIcon';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

export default function ModuleFailureModePill({ modeId, confidence = null, compact = false }) {
  if (!modeId) return null;

  const meta = getFailureModeMeta(modeId);
  const modeClass = getFailureModeClassName(modeId);

  return (
    <span
      className={`module-failure-pill ${modeClass}${compact ? ' module-failure-pill--compact' : ''}${confidence ? ` module-failure-pill--${confidence}` : ''}`}
      title={meta?.summary}
    >
      <FailureModeIcon modeId={modeId} size={14} />
      <span className="module-failure-pill-text">{meta?.title ?? modeId}</span>
    </span>
  );
}
