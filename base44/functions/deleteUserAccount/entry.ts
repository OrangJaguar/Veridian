import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

async function deleteAllForUser(base44: ReturnType<typeof createClientFromRequest>, userEmail: string) {
  const entities = [
    "Session",
    "Card",
    "Activity",
    "Module",
    "Journey",
    "UserDeck",
    "UserAiQuota",
    "UserTelemetry",
    "UserPreferences",
  ] as const;

  for (const name of entities) {
    const entity = base44.entities[name];
    if (!entity?.filter || !entity?.delete) continue;
    const rows = await entity.filter({ userEmail });
    for (const row of rows) {
      if (row?.id) await entity.delete(row.id);
    }
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    await deleteAllForUser(base44, user.email);

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
