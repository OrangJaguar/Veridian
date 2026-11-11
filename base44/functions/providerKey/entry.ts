import { createClientFromRequest } from "../_shared/supabaseBackend.ts";
import { serveApp } from "../_shared/serveApp.ts";
import { deleteUserApiKey, getUserApiKeyStatus, saveUserApiKey } from "../_shared/userApiKeys.ts";

serveApp(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed." } }, { status: 405 });
  }

  try {
    const backend = createClientFromRequest(req);
    const user = await backend.auth.me();
    if (!user?.id) {
      return Response.json({ error: { message: "Sign in to save an API key." } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { action?: string; apiKey?: string };
    const action = body.action ?? "status";

    if (action === "save") {
      const status = await saveUserApiKey(user.id, String(body.apiKey ?? ""));
      return Response.json({ data: status });
    }
    if (action === "delete") {
      const status = await deleteUserApiKey(user.id);
      return Response.json({ data: status });
    }
    if (action === "status") {
      const status = await getUserApiKeyStatus(user.id);
      return Response.json({ data: status });
    }
    return Response.json({ error: { message: "Unknown action." } }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update API key.";
    const status = /not configured/i.test(message) ? 503 : 400;
    return Response.json({ error: { message } }, { status });
  }
});
