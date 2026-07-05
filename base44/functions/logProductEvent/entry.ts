import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { serviceEntities } from "../_shared/serviceRole.ts";
import { checkRequestRateLimit, rateLimitKey } from "../_shared/requestRateLimit.ts";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "signup_click",
  "signin_click",
  "signup_start",
  "signup_complete",
  "signin_complete",
  "onboarding_start",
  "onboarding_complete",
  "baseline_start",
  "baseline_screen_1",
  "baseline_screen_2",
  "baseline_screen_3",
  "baseline_screen_4",
  "baseline_screen_4_start",
  "baseline_screen_4_submit",
  "baseline_screen_4_timeout",
  "baseline_screen_5",
  "baseline_complete_pass",
  "baseline_complete_fail",
  "baseline_skip",
  "baseline_reveal_view",
  "baseline_reveal_continue",
  "baseline_unlock",
  "landing_scroll_depth_25",
  "landing_scroll_depth_50",
  "landing_scroll_depth_75",
  "upload_cta_click",
  "journey_create_start",
  "journey_create_complete",
  "diagnostic_start",
  "diagnostic_complete",
  "diagnostic_skip",
  "first_study_session",
  "library_view",
  "library_preview",
  "library_clone_click",
]);

const MINUTE_MS = 60_000;
const MAX_EVENTS_PER_IP_MINUTE = 30;
const MAX_EVENTS_PER_ANON_MINUTE = 20;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (!checkRequestRateLimit(rateLimitKey("productEvent:ip", req), MAX_EVENTS_PER_IP_MINUTE, MINUTE_MS)) {
      return Response.json({ data: { ok: true, throttled: true } });
    }

    let user: { email?: string } | null = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const body = await req.json().catch(() => ({}));
    const event = String(body.event ?? "").trim();
    if (!ALLOWED_EVENTS.has(event)) {
      return Response.json({ error: { message: "Invalid event" } }, { status: 400 });
    }

    const anonymousId = String(body.anonymousId ?? "unknown").slice(0, 64);
    if (!checkRequestRateLimit(
      rateLimitKey("productEvent:anon", req, anonymousId),
      MAX_EVENTS_PER_ANON_MINUTE,
      MINUTE_MS,
    )) {
      return Response.json({ data: { ok: true, throttled: true } });
    }

    await serviceEntities(base44).ProductEvent.create({
      anonymousId,
      event,
      path: String(body.path ?? "").slice(0, 300),
      userEmail: user?.email,
      metadata: typeof body.metadata === "object" ? body.metadata : {},
      createdAt: Date.now(),
    });

    return Response.json({ data: { ok: true } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "logProductEvent failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
