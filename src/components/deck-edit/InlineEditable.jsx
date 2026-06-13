import { useState, useEffect, useRef } from 'react';

/**
 * Click-to-edit field with debounced onSave.
 */
export default function InlineEditable({ value, onSave, className = '', multiline = false, placeholder = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const timerRef = useRef(null);

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
      <textarea
        className={`deck-inline-input deck-inline-textarea${className ? ` ${className}` : ''}`}
        value={draft}
        autoFocus
        rows={3}
        onChange={(e) => scheduleSave(e.target.value)}
        onBlur={commit}
      />
    );
  }

  return (
    <input
      type="text"
      className={`deck-inline-input${className ? ` ${className}` : ''}`}
      value={draft}
      autoFocus
      onChange={(e) => scheduleSave(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
    />
  );
}
