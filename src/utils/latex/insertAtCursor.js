export function insertAtCursor(text, insertion, start, end) {
  const safeStart = start ?? text.length;
  const safeEnd = end ?? safeStart;
  const before = text.slice(0, safeStart);
  const after = text.slice(safeEnd);
  const next = `${before}${insertion}${after}`;
  const cursor = before.length + insertion.length;
  return { text: next, selectionStart: cursor, selectionEnd: cursor };
}
