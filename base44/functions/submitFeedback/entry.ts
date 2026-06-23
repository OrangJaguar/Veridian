import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { sendAdminEmail, clipString } from "../_shared/errorLog.ts";
import { serviceEntities } from "../_shared/serviceRole.ts";
import { checkRequestRateLimit, rateLimitKey } from "../_shared/requestRateLimit.ts";

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

    await serviceEntities(base44).FeedbackSubmission.create({
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
