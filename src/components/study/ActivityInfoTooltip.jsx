import { useState, useRef, useEffect, useId } from 'react';
import { Info } from 'lucide-react';
import { getActivityTooltip } from '@/utils/study/activityTooltips';

export default function ActivityInfoTooltip({ activityType, className = '' }) {
  const config = getActivityTooltip(activityType);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      ref={rootRef}
      className={`activity-info-tooltip-root${className ? ` ${className}` : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="activity-info-tooltip-trigger"
        aria-label={`About ${config.title}`}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={14} strokeWidth={2} />
      </button>
      {open ? (
        <div id={tooltipId} className="activity-info-tooltip-card" role="tooltip">
          <div className="activity-info-tooltip-card-icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.75} />
          </div>
          <div className="activity-info-tooltip-card-body">
            <strong className="activity-info-tooltip-card-title">{config.title}</strong>
            <p>{config.body}</p>
          </div>
        </div>
      ) : null}
    </span>
  );
}
