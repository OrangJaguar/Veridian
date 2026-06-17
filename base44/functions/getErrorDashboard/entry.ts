import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

type Base44Client = ReturnType<typeof createClientFromRequest>;

async function requireAdmin(base44: Base44Client) {
  const user = await base44.auth.me();
  if (!user?.email) {
    return { error: Response.json({ error: { message: "Unauthorized" } }, { status: 401 }) };
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin") {
    return { error: Response.json({ error: { message: "Forbidden" } }, { status: 403 }) };
  }
  return { user };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "listGroups";

    if (action === "listGroups") {
      const rows = await base44.entities.ErrorGroup.list();
      let groups = rows as Array<Record<string, unknown>>;

      if (body.status) {
        groups = groups.filter((g) => g.status === body.status);
      }
      if (body.environment) {
        groups = groups.filter((g) => g.environment === body.environment);
      }
      if (body.source) {
        groups = groups.filter((g) => g.source === body.source);
      }

      groups.sort((a, b) => (Number(b.lastSeenAt) || 0) - (Number(a.lastSeenAt) || 0));

      const limit = Math.min(Number(body.limit) || 50, 100);
      const offset = Number(body.offset) || 0;

      return Response.json({
        groups: groups.slice(offset, offset + limit),
        total: groups.length,
      });
    }

    if (action === "getGroup") {
      const groupId = body.groupId;
      if (!groupId) {
        return Response.json({ error: { message: "groupId required" } }, { status: 400 });
      }

      const groupRows = await base44.entities.ErrorGroup.filter({ groupId });
      const group = groupRows[0];
      if (!group) {
        return Response.json({ error: { message: "Group not found" } }, { status: 404 });
      }

      const occurrences = await base44.entities.ErrorOccurrence.filter({ groupId });
      const sorted = (occurrences as Array<{ createdAt?: number }>)
        .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0))
        .slice(0, 50);

      return Response.json({ group, occurrences: sorted });
    }

    if (action === "updateGroupStatus") {
      const { groupId, status } = body;
      if (!groupId || !["open", "resolved", "ignored"].includes(status)) {
        return Response.json({ error: { message: "Invalid groupId or status" } }, { status: 400 });
      }

      const groupRows = await base44.entities.ErrorGroup.filter({ groupId });
      const group = groupRows[0];
      if (!group?.id) {
        return Response.json({ error: { message: "Group not found" } }, { status: 404 });
      }

      const updated = await base44.entities.ErrorGroup.update(group.id, { status });
      return Response.json({ group: updated });
    }

    return Response.json({ error: { message: "Unknown action" } }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "getErrorDashboard failed";
    return Response.json({ error: { message: msg } }, { status: 500 });
  }
});
