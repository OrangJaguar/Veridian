import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

/**
 * Acknowledges async journey generation requests.
 * Client runs the full Gemma pipeline; this endpoint exists for future server-side migration
 * and deployment parity with the product spec.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed." } }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: { message: "Authentication required." } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const journeyId = String(body.journeyId ?? "");
    if (!journeyId) {
      return Response.json({ error: { message: "journeyId required" } }, { status: 400 });
    }

    return Response.json({
      data: { accepted: true, journeyId, note: "Generation runs on client pipeline." },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return Response.json({ error: { message } }, { status: 400 });
  }
});
