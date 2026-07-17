import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { logServerError } from "../_shared/logServerError.ts";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    // Synthetic anonymous-safe health probe
    const started = Date.now();
    let blogOk = false;
    let backupFresh = false;
    let lastBackupAt: number | null = null;
    const checks: Record<string, unknown> = {};

    try {
      const posts = await base44.asServiceRole.entities.BlogPost.filter({ status: "published" });
      blogOk = Array.isArray(posts);
      checks.publishedPostCount = Array.isArray(posts) ? posts.length : 0;
    } catch (err) {
      checks.blogError = err instanceof Error ? err.message : "blog check failed";
    }

    try {
      const backups = await base44.asServiceRole.entities.PlatformBackup.list();
      const sorted = (backups as Record<string, unknown>[])
        .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));
      lastBackupAt = sorted[0] ? Number(sorted[0].createdAt) : null;
      backupFresh = lastBackupAt != null && (Date.now() - lastBackupAt) < SEVEN_DAYS_MS;
      checks.lastBackupAt = lastBackupAt;
      checks.backupFresh = backupFresh;
    } catch (err) {
      checks.backupError = err instanceof Error ? err.message : "backup check failed";
    }

    const ok = blogOk;
    return Response.json({
      data: {
        ok,
        latencyMs: Date.now() - started,
        environment: Deno.env.get("ENVIRONMENT") ?? "production",
        sdkDebugHidden: true,
        checks,
      },
    });
  } catch (err) {
    await logServerError(base44, "platformHealthCheck", err);
    return Response.json({
      data: { ok: false, error: err instanceof Error ? err.message : "health failed" },
    }, { status: 500 });
  }
});
