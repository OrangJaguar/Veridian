function sanitizeFilename(name) {
  return (name ?? 'flashcards').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_') || 'flashcards';
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export cards as tab-separated values (Quizlet/Anki compatible).
 */
export function exportToTsv(cards, deckTitle) {
  const lines = cards.map((c) => `${(c.front ?? '').replace(/\t/g, ' ')}\t${(c.back ?? '').replace(/\t/g, ' ')}`);
  const content = lines.join('\n');
  triggerDownload(content, `${sanitizeFilename(deckTitle)}_flashcards.tsv`, 'text/tab-separated-values');
}

function csvEscape(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export cards as CSV with proper quoting.
 */
export function exportToCsv(cards, deckTitle) {
  const header = 'front,back';
  const rows = cards.map((c) => `${csvEscape(c.front)},${csvEscape(c.back)}`);
  const content = [header, ...rows].join('\n');
  triggerDownload(content, `${sanitizeFilename(deckTitle)}_flashcards.csv`, 'text/csv');
}
