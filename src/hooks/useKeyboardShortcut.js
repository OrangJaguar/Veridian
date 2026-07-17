import { useEffect } from 'react';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * Register a global keyboard shortcut.
 * @param {string} key - The key value (e.g., '?', 'Escape', 'k')
 * @param {Function} handler
 * @param {{ meta?: boolean, ctrl?: boolean, shift?: boolean, alt?: boolean, ignoreInputs?: boolean }} [options]
 */
export function useKeyboardShortcut(key, handler, options = {}) {
  useEffect(() => {
    const listener = (e) => {
      if (options.meta && !e.metaKey) return;
      if (options.ctrl && !e.ctrlKey) return;
      if (options.shift && !e.shiftKey) return;
      if (options.alt && !e.altKey) return;

      if (e.key !== key) return;

      const ignoreInputs = options.ignoreInputs !== false;
      if (ignoreInputs) {
        const tag = document.activeElement?.tagName;
        if (tag && INPUT_TAGS.has(tag)) return;
        if (document.activeElement?.isContentEditable) return;
      }

      e.preventDefault();
      handler(e);
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, handler, options.meta, options.ctrl, options.shift, options.alt, options.ignoreInputs]);
}
