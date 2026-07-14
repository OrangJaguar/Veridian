import FailureModeIcon from '@/components/failures/FailureModeIcon';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

export default function SessionFailureInsight({ insight, modeId = null }) {
  if (!insight) return null;

  const modeClass = modeId ? getFailureModeClassName(modeId) : '';

  return (
    <div className={`session-failure-insight ${modeClass}`.trim()} role="status">
      {modeId && <FailureModeIcon modeId={modeId} size={16} />}
      <p className="session-failure-insight-text">{insight}</p>
    </div>
  );
}
