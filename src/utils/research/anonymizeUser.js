/**
 * Stable positive integer from email for anonymized exports.
 * Client-side preview only; server uses salted hash for exports.
 */
export function hashEmailToAnonId(email, salt = 'veridian-research-v1') {
  const str = `${salt}:${String(email ?? '').toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
}
