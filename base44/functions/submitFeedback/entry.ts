import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { sendAdminEmail, clipString } from "../_shared/errorLog.ts";

const feedbackCounts = new Map<string, { count: number; resetAt: number }>();
const HOUR_MS = 60 * 60 * 1000;
const MAX_FEEDBACK_PER_HOUR = 5;

function checkFeedbackRateLimit(key: string) {
  const now = Date.now();
  const entry = feedbackCounts.get(key);
  if (!entry || now > entry.resetAt) {
    feedbackCounts.set(key, { count: 1, resetAt: now + HOUR_MS });
    return true;
  }
  if (entry.count >= MAX_FEEDBACK_PER_HOUR) return false;
  entry.count += 1;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user: { email?: string } | null = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
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

    const rateKey = user?.email ?? req.headers.get("x-forwarded-for") ?? "anon";
    if (!checkFeedbackRateLimit(rateKey)) {
      return Response.json({ error: { message: "Too many submissions. Try again later." } }, { status: 429 });
    }

    const submissionId = crypto.randomUUID();
    const now = Date.now();

    await base44.entities.FeedbackSubmission.create({
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
