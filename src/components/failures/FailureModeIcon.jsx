import { getFailureModeIcon, getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

export default function FailureModeIcon({ modeId, size = 20, className = '' }) {
  const Icon = getFailureModeIcon(modeId);
  const modeClass = getFailureModeClassName(modeId);

  return (
    <span className={`failure-mode-icon ${modeClass} ${className}`.trim()} aria-hidden="true">
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
