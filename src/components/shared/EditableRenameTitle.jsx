import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { AuthFieldRules, allRulesPass } from '@/components/auth/AuthFieldRules';

export default function EditableRenameTitle({
  value,
  onSave,
  buildRules,
  isValid,
  normalize = (v) => v.trim(),
  className = '',
  titleClassName = '',
  modalTitle = 'Fix the name',
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  const rules = buildRules(draft, focused || showErrors);
  const valid = isValid(normalize(draft));

  const startEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
    setShowErrors(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
    setShowErrors(false);
    setFocused(false);
  };

  const save = () => {
    const next = normalize(draft);
    if (!isValid(next)) {
      setShowErrors(true);
      return;
    }
    if (next !== (value ?? '')) {
      onSave(next);
    }
    setEditing(false);
    setShowErrors(false);
    setFocused(false);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (editing) {
    return (
      <div className={`editable-rename${className ? ` ${className}` : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className={`editable-rename-input${titleClassName ? ` ${titleClassName}` : ''}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
        />
        <div className="editable-rename-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={save}>
            Save
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={cancel}>
            Cancel
          </button>
        </div>
        {showErrors && !allRulesPass(rules) && (
          <div className="editable-rename-modal" role="alert">
            <p className="editable-rename-modal-title">{modalTitle}</p>
            <AuthFieldRules rules={rules} columns={1} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`editable-rename-display${className ? ` ${className}` : ''}`}>
      <h1 className={titleClassName || undefined}>{value}</h1>
      <button
        type="button"
        className="editable-rename-edit-btn"
        onClick={startEdit}
        aria-label="Rename"
      >
        <Pencil size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
