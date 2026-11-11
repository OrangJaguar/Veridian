import { runWithAiContext } from "./requestAiKey.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** Deno.serve wrapper that isolates per-request AI key state and adds CORS. */
export function serveApp(handler: (req: Request) => Promise<Response> | Response) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }
    try {
      const response = await runWithAiContext(() => handler(req));
      return withCors(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Server error";
      return withCors(Response.json({ error: { message } }, { status: 500 }));
    }
  });
}
