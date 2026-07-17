import { useState, useCallback } from 'react';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

const SHORTCUTS = [
  { section: 'Global', items: [
    { keys: ['Cmd', 'K'], desc: 'Open search' },
    { keys: ['?'], desc: 'Show this help' },
  ]},
  { section: 'Flashcards', items: [
    { keys: ['Space'], desc: 'Flip card' },
    { keys: ['1'], desc: 'Again' },
    { keys: ['2'], desc: 'Hard' },
    { keys: ['3'], desc: 'Good' },
    { keys: ['4'], desc: 'Easy' },
  ]},
  { section: 'Quiz / Cram', items: [
    { keys: ['Space'], desc: 'Next question' },
    { keys: ['1-N'], desc: 'Select option by number' },
  ]},
  { section: 'Free Recall', items: [
    { keys: ['Cmd', 'Enter'], desc: 'Submit recall' },
  ]},
];

export default function ShortcutHelpOverlay() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  useKeyboardShortcut('?', toggle);
  useKeyboardShortcut('Escape', () => setOpen(false), { ignoreInputs: false });

  if (!open) return null;

  return (
    <div className="shortcut-overlay" onClick={() => setOpen(false)}>
      <div className="shortcut-dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="shortcut-dialog-title">Keyboard Shortcuts</h2>
        {SHORTCUTS.map((section) => (
          <div key={section.section} className="shortcut-section">
            <h3 className="shortcut-section-title">{section.section}</h3>
            <div className="shortcut-list">
              {section.items.map((item) => (
                <div key={item.desc} className="shortcut-row">
                  <span className="shortcut-keys">
                    {item.keys.map((k) => (
                      <kbd key={k} className="shortcut-key">{k}</kbd>
                    ))}
                  </span>
                  <span className="shortcut-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
