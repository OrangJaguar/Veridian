import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sigma } from 'lucide-react';
import { MATH_SYMBOL_GROUPS, MATH_TEMPLATES } from '@/components/shared/mathSymbolsCatalog';

const PANEL_WIDTH = 260;
const PANEL_MAX_HEIGHT = 300;
const PORTAL_ROOT_ID = 'veridian-math-portal-root';

function getPortalRoot() {
  if (typeof document === 'undefined') return null;
  let root = document.getElementById(PORTAL_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = PORTAL_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

function computePanelPosition(triggerRect) {
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const panelHeight = Math.min(PANEL_MAX_HEIGHT, Math.max(180, vh * 0.45));

  let top = triggerRect.bottom + margin;
  if (top + panelHeight > vh - margin) {
    top = triggerRect.top - panelHeight - margin;
  }
  top = Math.max(margin, Math.min(top, vh - panelHeight - margin));

  let left = triggerRect.left + triggerRect.width / 2 - PANEL_WIDTH / 2;
  if (left + PANEL_WIDTH > vw - margin) {
    left = vw - PANEL_WIDTH - margin;
  }
  left = Math.max(margin, left);

  return { top, left, maxHeight: panelHeight };
}

export default function MathSymbolsButton({
  onInsert,
  disabled = false,
  className = '',
  onOpenChange,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [templateValues, setTemplateValues] = useState({});
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const setPanelOpen = useCallback((next) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) setCoords(null);
  }, [onOpenChange]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setCoords(computePanelPosition(trigger.getBoundingClientRect()));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onReflow = () => updatePosition();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setPanelOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, setPanelOpen]);

  const insert = (latex) => {
    onInsert(latex);
    setPanelOpen(false);
  };

  const insertTemplate = (template) => {
    const values = templateValues[template.id] ?? {};
    insert(template.build(values));
  };

  const setField = (templateId, key, value) => {
    setTemplateValues((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] ?? {}), [key]: value },
    }));
  };

  const toggleOpen = () => {
    if (open) {
      setPanelOpen(false);
      return;
    }
    updatePosition();
    setPanelOpen(true);
  };

  const portalRoot = getPortalRoot();

  const panel = open && coords && portalRoot ? (
    <div
      ref={panelRef}
      className="math-symbols-panel--portal"
      role="dialog"
      aria-label="Math symbols"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: PANEL_WIDTH,
        maxHeight: coords.maxHeight,
        bottom: 'auto',
        right: 'auto',
      }}
    >
      {MATH_SYMBOL_GROUPS.map((group) => (
        <section key={group.id} className="math-symbols-section">
          <h4 className="math-symbols-section-title">{group.label}</h4>
          <div className="math-symbols-grid">
            {group.symbols.map((sym) => (
              <button
                key={sym.label}
                type="button"
                className="math-symbols-chip"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insert(sym.latex)}
                title={sym.latex}
              >
                {sym.label}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="math-symbols-section">
        <h4 className="math-symbols-section-title">Templates</h4>
        <div className="math-symbols-templates">
          {MATH_TEMPLATES.map((template) => (
            <div key={template.id} className="math-symbols-template">
              <span className="math-symbols-template-label">{template.label}</span>
              <div className="math-symbols-template-fields">
                {template.fields.map((field) => (
                  <input
                    key={field.key}
                    type="text"
                    className="math-symbols-field"
                    placeholder={field.placeholder}
                    value={templateValues[template.id]?.[field.key] ?? ''}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => setField(template.id, field.key, e.target.value)}
                  />
                ))}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm math-symbols-insert-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertTemplate(template)}
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <div className={`math-symbols-wrap${className ? ` ${className}` : ''}`}>
        <button
          ref={triggerRef}
          type="button"
          className="math-symbols-trigger"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleOpen}
          disabled={disabled}
          aria-label="Insert math symbol"
          aria-expanded={open}
        >
          <Sigma size={16} strokeWidth={2} />
        </button>
      </div>
      {panel && createPortal(panel, portalRoot)}
    </>
  );
}
