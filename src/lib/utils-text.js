/** HTML escaping and journal preview helpers (no app state). */

export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripJournalHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').trim();
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function firstSentencePreview(text) {
  const clean = stripJournalHtml(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'No entry yet';
  const parts = clean.split(/(?<=[.!?])\s+/);
  return (parts[0] || clean).slice(0, 180);
}

export function journalPreviewForQuery(content, query) {
  const clean = stripJournalHtml(content || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'No entry yet';
  if (!query) return escapeHtml(firstSentencePreview(clean));
  const re = new RegExp(escapeRegExp(query), 'i');
  const match = clean.match(re);
  if (!match || match.index == null) return escapeHtml(firstSentencePreview(clean));
  const start = Math.max(0, match.index - 26);
  const end = Math.min(clean.length, match.index + match[0].length + 26);
  const seg = clean.slice(start, end);
  const localIdx = match.index - start;
  const before = escapeHtml(seg.slice(0, localIdx));
  const hit = escapeHtml(seg.slice(localIdx, localIdx + match[0].length));
  const after = escapeHtml(seg.slice(localIdx + match[0].length));
  return `${start > 0 ? '...' : ''}${before}<mark class="journal-match-mark">${hit}</mark>${after}${end < clean.length ? '...' : ''}`;
}