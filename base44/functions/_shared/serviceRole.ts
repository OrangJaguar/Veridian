import type { BackendClient, EntityHandle } from "./backendTypes.ts";

/**
 * Service-role entity access — bypasses RLS entirely.
 * Use ONLY when the calling function is itself the trust boundary
 * or is admin-gated.
 */
export function serviceEntities(base44: BackendClient): Record<string, EntityHandle> {
  if (!base44.asServiceRole) {
    throw new Error("Service role is not available in this context.");
  }
  return base44.asServiceRole.entities;
}
