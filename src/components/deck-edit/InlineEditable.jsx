import { useState, useEffect, useRef } from 'react';
import MathSymbolsButton from '@/components/shared/MathSymbolsButton';
import { insertAtCursor } from '@/utils/latex/insertAtCursor';

/**
 * Click-to-edit field with debounced onSave.
 */
export default function InlineEditable({ value, onSave, className = '', multiline = false, placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [mathOpen, setMathOpen] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  const scheduleSave = (next) => {
    setDraft(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (next.trim() !== (value ?? '').trim()) onSave(next.trim());
    }, 600);
  };

  const commit = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (draft.trim() !== (value ?? '').trim()) onSave(draft.trim());
    setEditing(false);
    setMathOpen(false);
  };

  const handleBlur = (e) => {
    const next = e.relatedTarget;
    if (mathOpen) return;
    if (next && wrapRef.current?.contains(next)) return;
    if (next?.closest?.('.math-symbols-panel--portal')) return;
    commit();
  };

  const handleMathInsert = (latex) => {
    const el = inputRef.current;
    if (!el) {
      scheduleSave(`${draft}${latex}`);
      return;
    }
    const { text, selectionStart, selectionEnd } = insertAtCursor(
      draft,
      latex,
      el.selectionStart,
      el.selectionEnd,
    );
    scheduleSave(text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  if (!editing) {
    return (
      <button
        type="button"
        className={`deck-inline-field${className ? ` ${className}` : ''}${!value ? ' is-empty' : ''}`}
        onClick={() => setEditing(true)}
      >
        {value || placeholder}
      </button>
    );
  }

  if (multiline) {
    return (
      <div className="deck-inline-edit-wrap" ref={wrapRef}>
        <textarea
          ref={inputRef}
          className={`deck-inline-input deck-inline-textarea${className ? ` ${className}` : ''}`}
          value={draft}
          autoFocus
          rows={3}
          onChange={(e) => scheduleSave(e.target.value)}
          onBlur={handleBlur}
        />
        <MathSymbolsButton
          onInsert={handleMathInsert}
          onOpenChange={setMathOpen}
          className="deck-inline-math-btn"
        />
      </div>
    );
  }

  return (
    <div className="deck-inline-edit-wrap" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className={`deck-inline-input${className ? ` ${className}` : ''}`}
        value={draft}
        autoFocus
        onChange={(e) => scheduleSave(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      />
      <MathSymbolsButton
        onInsert={handleMathInsert}
        onOpenChange={setMathOpen}
        className="deck-inline-math-btn"
      />
    </div>
  );
}
