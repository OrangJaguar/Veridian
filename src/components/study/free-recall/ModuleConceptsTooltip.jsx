import { useState, useRef, useEffect, useId } from 'react';
import { HelpCircle } from 'lucide-react';

export default function ModuleConceptsTooltip({ concepts = [], className = '' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const tooltipId = useId();
  const terms = concepts.map((c) => c.term).filter(Boolean);

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

  if (!terms.length) return null;

  return (
    <span
      ref={rootRef}
      className={`module-concepts-tooltip${className ? ` ${className}` : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="module-concepts-tooltip-trigger"
        aria-label="Topics covered in this module"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle size={16} strokeWidth={2} />
      </button>
      {open ? (
        <div id={tooltipId} className="module-concepts-tooltip-card" role="tooltip">
          <strong className="module-concepts-tooltip-title">Topics in this module</strong>
          <ul className="module-concepts-tooltip-list">
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </span>
  );
}
