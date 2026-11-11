import type { BackendClient, BackendUser } from "./backendTypes.ts";

export async function requireAdmin(base44: BackendClient): Promise<{ user?: BackendUser; error?: Response }> {
  const user = await base44.auth.me();
  if (!user?.email) {
    return { error: Response.json({ error: { message: "Unauthorized" } }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { error: Response.json({ error: { message: "Forbidden" } }, { status: 403 }) };
  }
  return { user };
}
