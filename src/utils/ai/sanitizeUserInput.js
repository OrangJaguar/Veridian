/**
 * Client-side trim + length limits before AI invoke (server is authoritative).
 */
export function sanitizeUserInput(value, maxLength = 80_000) {
  if (value == null) return '';
  return String(value).replace(/\0/g, '').trim().slice(0, maxLength);
}

export function sanitizeMaterialInput(material) {
  return sanitizeUserInput(material, 80_000);
}

export function sanitizeShortLabel(value, maxLength = 200) {
  return sanitizeUserInput(value, maxLength);
}
