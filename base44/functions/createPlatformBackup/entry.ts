import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { requireAdmin } from "../_shared/requireAdmin.ts";
import { logServerError } from "../_shared/logServerError.ts";
import { writeAudit } from "../_shared/blogValidation.ts";

const BACKUP_SCHEMA_VERSION = 1;
const ENTITY_KEYS = [
  "UserPreferences",
  "Journey",
  "Module",
  "Activity",
  "Card",
  "Session",
  "BlogPost",
  "BlogAsset",
  "PlanOverride",
  "StudyCommitment",
  "MasterySnapshot",
];

async function listAllPaginated(
  entity: { list: (sort?: string, limit?: number, skip?: number) => Promise<unknown[]> },
  pageSize = 200,
) {
  const all: unknown[] = [];
  let skip = 0;
  for (;;) {
    let page: unknown[] = [];
    try {
      page = await entity.list("-createdAt", pageSize, skip);
    } catch {
      try {
        page = await entity.list();
      } catch {
        page = [];
      }
      all.push(...(page ?? []));
      break;
    }
    if (!page?.length) break;
    all.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
    if (skip > 50_000) break;
  }
  return all;
}

async function sha256Hex(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;
    const adminEmail = (auth.user as { email?: string }).email ?? "";

    const entities: Record<string, unknown[]> = {};
    const entityCounts: Record<string, number> = {};
    const missing: string[] = [];

    for (const key of ENTITY_KEYS) {
      const ent = (base44.entities as Record<string, { list: (...a: unknown[]) => Promise<unknown[]> }>)[key];
      if (!ent?.list) {
        missing.push(key);
        entityCounts[key] = 0;
        entities[key] = [];
        continue;
      }
      try {
        const rows = await listAllPaginated(ent);
        entities[key] = rows;
        entityCounts[key] = rows.length;
      } catch {
        missing.push(key);
        entities[key] = [];
        entityCounts[key] = 0;
      }
    }

    const payload = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      createdAt: Date.now(),
      createdBy: adminEmail,
      entityCounts,
      missing,
      entities,
    };
    const payloadJson = JSON.stringify(payload);
    const checksum = await sha256Hex(payloadJson);
    const backupId = `bkp_${crypto.randomUUID()}`;

    // Store a compact index record; full JSON returned to caller for download
    const MAX_STORE = 900_000;
    const storeJson = payloadJson.length <= MAX_STORE
      ? payloadJson
      : JSON.stringify({
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt: payload.createdAt,
        entityCounts,
        missing,
        note: "Full payload returned in response only; too large to persist inline",
      });

    await base44.entities.PlatformBackup.create({
      backupId,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      createdAt: payload.createdAt,
      createdBy: adminEmail,
      entityCounts,
      checksum,
      payloadJson: storeJson,
      byteLength: payloadJson.length,
      status: missing.length ? "partial" : "ok",
    });

    await writeAudit(base44, {
      adminEmail,
      action: "platformBackup",
      targetType: "PlatformBackup",
      targetId: backupId,
      detail: { entityCounts, checksum, byteLength: payloadJson.length },
    });

    return Response.json({
      data: {
        backupId,
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt: payload.createdAt,
        entityCounts,
        checksum,
        byteLength: payloadJson.length,
        status: missing.length ? "partial" : "ok",
        missing,
        payload,
      },
    });
  } catch (err) {
    await logServerError(base44, "createPlatformBackup", err);
    const message = err instanceof Error ? err.message : "Backup failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
