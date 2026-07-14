import { useState, useRef, useEffect, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { getActivityTooltip } from '@/utils/study/activityTooltips';

const TOOLTIP_GAP = 8;
const VIEWPORT_PAD = 12;

export default function ActivityInfoTooltip({ activityType, className = '' }) {
  const config = getActivityTooltip(activityType);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'below' });
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const trigger = rootRef.current;
    const card = cardRef.current;
    if (!trigger || !card) return;

    const rect = trigger.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardWidth = cardRect.width || 280;
    const cardHeight = cardRect.height || 120;

    let top = rect.bottom + TOOLTIP_GAP;
    let placement = 'below';
    if (top + cardHeight > window.innerHeight - VIEWPORT_PAD) {
      top = rect.top - cardHeight - TOOLTIP_GAP;
      placement = 'above';
    }
    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - cardHeight - VIEWPORT_PAD));

    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - cardWidth - VIEWPORT_PAD));

    setPosition({ top, left, placement });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (rootRef.current?.contains(e.target)) return;
      if (cardRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!config) return null;

  const Icon = config.icon;

  const tooltipCard = open ? (
    <div
      ref={cardRef}
      id={tooltipId}
      className={`activity-info-tooltip-card activity-info-tooltip-card--portal activity-info-tooltip-card--${position.placement}`}
      role="tooltip"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000,
      }}
    >
      <div className="activity-info-tooltip-card-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="activity-info-tooltip-card-body">
        <strong className="activity-info-tooltip-card-title">{config.title}</strong>
        <p>{config.body}</p>
      </div>
    </div>
  ) : null;

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
      {typeof document !== 'undefined' && tooltipCard
        ? createPortal(tooltipCard, document.body)
        : null}
    </span>
  );
}
