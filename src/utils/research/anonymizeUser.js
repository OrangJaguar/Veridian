/**
 * HMAC-SHA256 pseudonym for anonymized exports (matches server researchSalt.ts).
 * Salt must be passed explicitly — real exports use server-side RESEARCH_SALT only.
 */
export async function hashEmailToAnonId(email, salt) {
  if (!salt) {
    throw new Error('hashEmailToAnonId requires an explicit salt');
  }
  const normalized = String(email ?? '').trim().toLowerCase();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
