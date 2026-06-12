import { useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function GuideSectionPicker({
  open,
  onToggle,
  sections,
  currentIndex,
  completedIds,
  onJump,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, onToggle]);

  return (
    <div className="guide-section-picker" ref={wrapRef}>
      <button
        type="button"
        className="guide-section-picker-trigger"
        onClick={() => onToggle(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Section {currentIndex + 1} of {sections.length}
        <ChevronDown size={14} className={`guide-section-picker-chevron${open ? ' open' : ''}`} />
      </button>

      {open && (
        <div className="guide-section-picker-menu" role="listbox" aria-label="Guide sections">
          {sections.map((s, i) => {
            const isCurrent = i === currentIndex;
            const isDone = completedIds.includes(s.sectionId);
            return (
              <button
                key={s.sectionId}
                type="button"
                role="option"
                aria-selected={isCurrent}
                className={`guide-section-picker-item${isCurrent ? ' current' : ''}${isDone ? ' done' : ''}`}
                onClick={() => {
                  onJump(i);
                  onToggle(false);
                }}
              >
                <span className="guide-section-picker-num">{i + 1}</span>
                <span className="guide-section-picker-title">{s.title}</span>
                {isDone && <span className="guide-section-picker-done">Done</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
