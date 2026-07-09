type Base44Client = ReturnType<typeof import("npm:@base44/sdk@0.8.31").createClientFromRequest>;

/**
 * Service-role entity access — bypasses RLS entirely.
 * Use ONLY when the calling function is itself the trust boundary (e.g. anonymous
 * error logging with input validation + rate limiting) or is admin-gated.
 * Never use as a silent fallback — throws if service role is unavailable.
 */
export function serviceEntities(base44: Base44Client) {
  if (!base44.asServiceRole) {
    throw new Error("Service role is not available in this context.");
  }
  return base44.asServiceRole.entities;
}