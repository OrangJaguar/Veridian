import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

type Base44Client = ReturnType<typeof createClientFromRequest>;

const HOUR_MS = 60 * 60 * 1000;
const MAX_ERRORS_PER_IP_HOUR = 40;

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const groupRateCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

function checkRequestRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

function rateLimitKey(scope: string, req: Request, extra?: string) {
  const ip = getClientIp(req);
  const suffix = extra ? `:${extra}` : "";
  return `${scope}:${ip}${suffix}`;
}

function serviceEntities(base44: Base44Client) {
  if (!base44.asServiceRole) {
    throw new Error("Service role is not available in this context.");
  }
  return base44.asServiceRole.entities;
}

function normalizeMessage(message = "") {
  return String(message)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<id>")
    .replace(/\b\d+\b/g, "<n>")
    .trim()
    .slice(0, 500);
}

function topStackFrame(stack = "") {
  const skip = [/node_modules/i, /chrome-extension/i, /@vite/i];
  const lines = String(stack).split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (skip.some((p) => p.test(line))) continue;
    if (line.startsWith("at ") || line.includes("@")) return line.slice(0, 300);
  }
  return lines[0]?.slice(0, 300) ?? "";
}

function fingerprintError(message: string, stack = "") {
  const key = `${normalizeMessage(message)}::${topStackFrame(stack)}`;
  let hash = 5381;
  for (let i = 0; i < key.length; i += 1) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
    hash &= 0xffffffff;
  }
  return Math.abs(hash).toString(36);
}

function clipString(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}

function checkGroupRateLimit(groupId: string) {
  const now = Date.now();
  const entry = groupRateCounts.get(groupId);
  if (!entry || now > entry.resetAt) {
    groupRateCounts.set(groupId, { count: 1, resetAt: now + HOUR_MS });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count += 1;
  return true;
}

function parseAlertThresholds(raw: string | undefined) {
  const defaults = [1, 10, 50];
  if (!raw) return defaults;
  const parsed = raw.split(",").map((n) => Number(n.trim())).filter((n) => n > 0);
  return parsed.length ? parsed : defaults;
}

async function sendAdminEmail(
  base44: Base44Client,
  to: string,
  subject: string,
  body: string,
) {
  const send = base44.integrations?.Core?.SendEmail;
  if (send) {
    await send({ to, subject, body });
    return true;
  }
  console.log("[errorAlert] would send", { to, subject });
  return false;
}

type ErrorGroupRow = {
  id?: string;
  groupId: string;
  message: string;
  stackSample?: string;
  source?: string;
  route?: string;
  environment?: string;
  occurrenceCount?: number;
  distinctUserCount?: number;
  distinctUserEmails?: string[];
  firstSeenAt?: number;
  lastSeenAt?: number;
  lastAlertedAt?: number;
  alertThresholdsSent?: string[];
  status?: string;
};

async function upsertErrorLog(
  base44: Base44Client,
  payload: {
    message: string;
    stack?: string;
    route?: string;
    source: string;
    environment: string;
    userEmail?: string;
    userId?: string;
    clientInfo?: Record<string, unknown>;
    context?: Record<string, unknown>;
  },
) {
  const message = clipString(payload.message, 2000);
  const stack = clipString(payload.stack, 8000);
  const groupId = fingerprintError(message, stack);

  if (!checkGroupRateLimit(groupId)) {
    return { ok: true, groupId, rateLimited: true };
  }

  const now = Date.now();
  const occurrenceId = crypto.randomUUID();
  const entities = serviceEntities(base44);

  const existingRows = await entities.ErrorGroup.filter({ groupId });
  const existing = existingRows[0] as ErrorGroupRow | undefined;

  let group: ErrorGroupRow;
  let isNewGroup = false;

  if (existing?.id) {
    const emails = new Set(existing.distinctUserEmails ?? []);
    if (payload.userEmail) emails.add(payload.userEmail);
    const cappedEmails = [...emails].slice(-100);

    group = {
      ...existing,
      occurrenceCount: (existing.occurrenceCount ?? 0) + 1,
      distinctUserCount: cappedEmails.length,
      distinctUserEmails: cappedEmails,
      lastSeenAt: now,
      route: payload.route ?? existing.route,
    };

    await entities.ErrorGroup.update(existing.id, group);
  } else {
    isNewGroup = true;
    const emails = payload.userEmail ? [payload.userEmail] : [];
    group = {
      groupId,
      message,
      stackSample: stack,
      source: payload.source,
      route: payload.route ?? "",
      environment: payload.environment,
      occurrenceCount: 1,
      distinctUserCount: emails.length,
      distinctUserEmails: emails,
      firstSeenAt: now,
      lastSeenAt: now,
      alertThresholdsSent: [],
      status: "open",
    };
    await entities.ErrorGroup.create(group);
  }

  await entities.ErrorOccurrence.create({
    occurrenceId,
    groupId,
    message,
    stack,
    route: payload.route ?? "",
    environment: payload.environment,
    source: payload.source,
    userEmail: payload.userEmail,
    userId: payload.userId,
    clientInfo: payload.clientInfo ?? {},
    context: payload.context ?? {},
    createdAt: now,
  });

  const adminEmail = Deno.env.get("ADMIN_ALERT_EMAIL");
  const thresholds = parseAlertThresholds(Deno.env.get("ERROR_ALERT_THRESHOLDS"));
  const count = group.occurrenceCount ?? 1;
  const sent = new Set(group.alertThresholdsSent ?? []);
  let shouldAlert = false;
  let thresholdKey = "";

  if (isNewGroup) {
    shouldAlert = true;
    thresholdKey = "new";
  } else {
    for (const t of thresholds) {
      const key = String(t);
      if (count >= t && !sent.has(key)) {
        shouldAlert = true;
        thresholdKey = key;
        break;
      }
    }
  }

  if (shouldAlert && adminEmail && existing?.id) {
    const updatedSent = [...sent, thresholdKey || "new"];
    await entities.ErrorGroup.update(existing.id, {
      lastAlertedAt: now,
      alertThresholdsSent: updatedSent,
    });
  } else if (shouldAlert && adminEmail && !existing?.id) {
    const rows = await entities.ErrorGroup.filter({ groupId });
    const row = rows[0];
    if (row?.id) {
      await entities.ErrorGroup.update(row.id, {
        lastAlertedAt: now,
        alertThresholdsSent: ["new"],
      });
    }
  }

  if (shouldAlert && adminEmail) {
    await sendAdminEmail(
      base44,
      adminEmail,
      `[Veridian Error] ${message.slice(0, 80)} (${count}×)`,
      [
        `Message: ${message}`,
        `Source: ${payload.source}`,
        `Route: ${payload.route ?? "—"}`,
        `Environment: ${payload.environment}`,
        `Occurrences: ${count}`,
        `Users affected: ${group.distinctUserCount ?? 0}`,
        "",
        stack.slice(0, 2000),
      ].join("\n"),
    );
  }

  return { ok: true, groupId, isNewGroup, occurrenceCount: count };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!checkRequestRateLimit(rateLimitKey("logAppError", req), MAX_ERRORS_PER_IP_HOUR, HOUR_MS)) {
      return Response.json({ ok: true, rateLimited: true });
    }

    let user: { email?: string; id?: string } | null = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const body = await req.json().catch(() => ({}));
    const message = clipString(body.message, 2000);
    if (!message) {
      return Response.json({ error: { message: "message is required" } }, { status: 400 });
    }

    const result = await upsertErrorLog(base44, {
      message,
      stack: clipString(body.stack, 8000),
      route: clipString(body.route, 500),
      source: body.source === "server" ? "server" : "client",
      environment: clipString(body.environment, 32) || "production",
      userEmail: user?.email,
      userId: user?.id,
      clientInfo: typeof body.clientInfo === "object" ? body.clientInfo : {},
      context: typeof body.context === "object" ? body.context : {},
    });

    return Response.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "logAppError failed";
    console.error("[logAppError]", msg);
    return Response.json({ error: { message: msg } }, { status: 500 });
  }
});
