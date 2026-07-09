/**
 * Research email anonymization salt — must be set in Base44 secrets.
 * Never hardcode a default; that would let anyone reverse anonymized IDs.
 */
export function getResearchSalt(): string {
  const salt = Deno.env.get("RESEARCH_SALT")?.trim();
  if (!salt) {
    throw new Error(
      "RESEARCH_SALT is not configured. Set it in Base44 secrets: base44 secrets set RESEARCH_SALT=<random-string>",
    );
  }
  return salt;
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * HMAC-SHA256 pseudonym for research exports. Returns a 64-char hex string.
 */
export async function hashEmailToAnonId(email: string, salt: string): Promise<string> {
  const normalized = String(email ?? "").trim().toLowerCase();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(normalized),
  );
  return toHex(signature);
}

export async function buildAnonMap(emails: Iterable<string>) {
  const salt = getResearchSalt();
  const map: Record<string, string> = {};
  const unique = [...new Set(emails)].filter(Boolean);
  await Promise.all(
    unique.map(async (email) => {
      map[email] = await hashEmailToAnonId(email, salt);
    }),
  );
  return map;
}
