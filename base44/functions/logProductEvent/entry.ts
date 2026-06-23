import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const ALLOWED_EVENTS = new Set([
  "landing_view",
  "signup_click",
  "signin_click",
  "signup_start",
  "signup_complete",
  "signin_complete",
  "onboarding_start",
  "onboarding_complete",
  "journey_create_start",
  "journey_create_complete",
  "first_study_session",
  "library_view",
  "library_preview",
  "library_clone_click",
]);

const rateByAnon = new Map<string, number[]>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function rateLimit(anonymousId: string) {
  const now = Date.now();
  const prev = (rateByAnon.get(anonymousId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_LIMIT) return false;
  prev.push(now);
  rateByAnon.set(anonymousId, prev);
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
    const event = String(body.event ?? "").trim();
    if (!ALLOWED_EVENTS.has(event)) {
      return Response.json({ error: { message: "Invalid event" } }, { status: 400 });
    }

    const anonymousId = String(body.anonymousId ?? "unknown").slice(0, 64);
    if (!rateLimit(anonymousId)) {
      return Response.json({ data: { ok: true, throttled: true } });
    }

    await base44.entities.ProductEvent.create({
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
