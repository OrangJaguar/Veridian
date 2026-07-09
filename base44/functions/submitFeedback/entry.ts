import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

type Base44Client = ReturnType<typeof createClientFromRequest>;

function clipString(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function serviceEntities(base44: Base44Client) {
  if (!base44.asServiceRole) {
    throw new Error("Service role is not available in this context.");
  }
  return base44.asServiceRole.entities;
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
  console.log("[submitFeedback] would send", { to, subject });
  return false;
}

const buckets = new Map<string, { count: number; resetAt: number }>();

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
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
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

const HOUR_MS = 60 * 60 * 1000;
const MAX_FEEDBACK_PER_IP_HOUR = 5;
const MAX_FEEDBACK_PER_USER_HOUR = 8;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!checkRequestRateLimit(rateLimitKey("feedback:ip", req), MAX_FEEDBACK_PER_IP_HOUR, HOUR_MS)) {
      return Response.json({ error: { message: "Too many submissions. Try again later." } }, { status: 429 });
    }

    let user: { email?: string } | null = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    if (user?.email && !checkRequestRateLimit(
      rateLimitKey("feedback:user", req, user.email),
      MAX_FEEDBACK_PER_USER_HOUR,
      HOUR_MS,
    )) {
      return Response.json({ error: { message: "Too many submissions. Try again later." } }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const type = body.type;
    const message = clipString(body.message, 2000);

    if (!["bug", "feature", "general"].includes(type)) {
      return Response.json({ error: { message: "Invalid feedback type" } }, { status: 400 });
    }
    if (message.length < 10) {
      return Response.json({ error: { message: "Message too short" } }, { status: 400 });
    }

    const replyEmail = clipString(body.replyEmail, 200).trim();
    if (replyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail)) {
      return Response.json({ error: { message: "Invalid email" } }, { status: 400 });
    }

    const submissionId = crypto.randomUUID();
    const now = Date.now();

    const feedbackEntities = user?.email
      ? base44.entities.FeedbackSubmission
      : serviceEntities(base44).FeedbackSubmission;
    await feedbackEntities.create({
      submissionId,
      type,
      message,
      replyEmail: replyEmail || undefined,
      userEmail: user?.email,
      route: clipString(body.route, 500),
      clientInfo: typeof body.clientInfo === "object" ? body.clientInfo : {},
      createdAt: now,
    });

    const adminEmail = Deno.env.get("ADMIN_ALERT_EMAIL");
    if (adminEmail) {
      const typeLabel = type === "bug" ? "Bug Report" : type === "feature" ? "Feature Request" : "General Feedback";
      await sendAdminEmail(
        base44,
        adminEmail,
        `[Veridian Feedback] ${typeLabel}`,
        [
          `Type: ${typeLabel}`,
          `From: ${user?.email ?? replyEmail ?? "anonymous"}`,
          `Reply to: ${replyEmail || "—"}`,
          `Route: ${body.route ?? "—"}`,
          "",
          message,
        ].join("\n"),
      );
    }

    return Response.json({ ok: true, submissionId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "submitFeedback failed";
    return Response.json({ error: { message: msg } }, { status: 500 });
  }
});