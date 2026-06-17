import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";
import { upsertErrorLog, clipString } from "../_shared/errorLog.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
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
