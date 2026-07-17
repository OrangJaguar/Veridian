const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  /(?:youtube\.com\/embed\/)([\w-]{11})/,
  /(?:youtube\.com\/v\/)([\w-]{11})/,
];

/**
 * Basic URL format validation (must be http or https).
 */
export function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const url = new URL(str.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if the URL points to a YouTube video.
 */
export function isYouTubeUrl(str) {
  if (!isValidUrl(str)) return false;
  return YOUTUBE_PATTERNS.some((re) => re.test(str.trim()));
}

/**
 * Extract the 11-character YouTube video ID from a URL.
 * Returns null if not a YouTube URL.
 */
export function extractYouTubeVideoId(str) {
  if (!str) return null;
  const trimmed = str.trim();
  for (const re of YOUTUBE_PATTERNS) {
    const match = trimmed.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}
