/**
 * Stable positive integer from email for anonymized exports.
 * Salt must be passed explicitly — real exports use server-side RESEARCH_SALT only.
 */
export function hashEmailToAnonId(email, salt) {
  if (!salt) {
    throw new Error('hashEmailToAnonId requires an explicit salt');
  }
  const str = `${salt}:${String(email ?? '').toLowerCase()}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) || 1;
}
