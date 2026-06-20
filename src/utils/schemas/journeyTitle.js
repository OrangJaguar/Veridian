export const JOURNEY_TITLE_MIN = 3;
export const JOURNEY_TITLE_MAX = 50;

/** Display-safe chars that slug cleanly for future URLs. */
const JOURNEY_TITLE_CHARS = /^[A-Za-z0-9][A-Za-z0-9\s\-&]*$/;

export function normalizeJourneyTitle(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function isValidJourneyTitle(value) {
  const title = normalizeJourneyTitle(value);
  if (title.length < JOURNEY_TITLE_MIN || title.length > JOURNEY_TITLE_MAX) return false;
  return JOURNEY_TITLE_CHARS.test(title);
}

export function journeyTitleSlugPreview(value) {
  return normalizeJourneyTitle(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
