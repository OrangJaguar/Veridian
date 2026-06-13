/**
 * Client-side Quizlet-style parser (fallback before/alongside AI).
 */
export function parseQuizletFormat(raw = '') {
  const text = String(raw).trim();
  if (!text) return [];

  const pairs = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.includes('\t')) {
      const [front, ...rest] = line.split('\t');
      const back = rest.join('\t').trim();
      if (front?.trim() && back) pairs.push({ front: front.trim(), back });
      continue;
    }

    const colonMatch = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (colonMatch) {
      pairs.push({ front: colonMatch[1].trim(), back: colonMatch[2].trim() });
      continue;
    }

    const dashMatch = line.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (dashMatch) {
      pairs.push({ front: dashMatch[1].trim(), back: dashMatch[2].trim() });
      continue;
    }
  }

  if (pairs.length) return pairs;

  for (let i = 0; i < lines.length - 1; i += 2) {
    pairs.push({ front: lines[i], back: lines[i + 1] });
  }

  return pairs.filter((p) => p.front && p.back);
}
