/**
 * Derive YouTube search queries from a section title (client-side only).
 */
export function youtubeQueriesFromTitle(title) {
  const base = String(title ?? '').trim();
  if (!base) return [];
  return [
    `${base} explained for beginners`,
    `${base} worked examples`,
  ];
}
