import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

async function requireAdmin(base44: ReturnType<typeof createClientFromRequest>) {
  const user = await base44.auth.me();
  if (!user?.email) {
    return { error: Response.json({ error: { message: "Unauthorized" } }, { status: 401 }) };
  }
  if ((user as { role?: string }).role !== "admin") {
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
    const action = body.action ?? "publish";
    const journeyId = String(body.journeyId ?? "");

    if (!journeyId) {
      return Response.json({ error: { message: "journeyId required" } }, { status: 400 });
    }

    const journeys = await base44.entities.Journey.filter({ journeyId });
    const journey = journeys[0] as Record<string, unknown> | undefined;
    if (!journey) {
      return Response.json({ error: { message: "Journey not found" } }, { status: 404 });
    }

    const adminEmail = (auth.user as { email?: string }).email ?? "";
    if (journey.userEmail !== adminEmail && !journey.isAdminAuthored) {
      return Response.json({ error: { message: "Not an admin journey" } }, { status: 403 });
    }

    const modules = (await base44.entities.Module.filter({ journeyId })) as Array<Record<string, unknown>>;
    const activities = (await base44.entities.Activity.filter({ journeyId })) as Array<Record<string, unknown>>;
    const cards = (await base44.entities.Card.filter({ journeyId })) as Array<Record<string, unknown>>;

    if (action === "validate") {
      const issues: string[] = [];
      if (!modules.length) issues.push("Add at least one module.");
      for (const mod of modules) {
        const mid = String(mod.moduleId);
        if (mod.moduleStatus !== "ready") {
          issues.push(`Module "${mod.name}" is not marked ready.`);
        }
        const guide = activities.find((a) => a.moduleId === mid && a.type === "learningGuide");
        const quiz = activities.find((a) => a.moduleId === mid && a.type === "practiceQuiz");
        const deck = activities.find((a) => a.moduleId === mid && a.type === "flashcardSet");
        const guideContent = guide?.content as Record<string, unknown> | undefined;
        if (!guideContent?.sections || !(guideContent.sections as unknown[]).length) {
          issues.push(`Module "${mod.name}" needs learning guide sections.`);
        }
        const bank = (quiz?.content as Record<string, unknown> | undefined)?.questionBank;
        if (!Array.isArray(bank) || bank.length < 1) {
          issues.push(`Module "${mod.name}" needs practice questions.`);
        }
        const deckCards = cards.filter((c) => c.activityId === deck?.activityId);
        if (!deckCards.length) {
          issues.push(`Module "${mod.name}" needs flashcards.`);
        }
      }
      return Response.json({ data: { ok: !issues.length, issues } });
    }

    if (action === "publish") {
      const issues: string[] = [];
      if (!modules.length) issues.push("Add at least one module.");
      for (const mod of modules) {
        const mid = String(mod.moduleId);
        if (mod.moduleStatus !== "ready") issues.push(`Module "${mod.name}" is not ready.`);
        const guide = activities.find((a) => a.moduleId === mid && a.type === "learningGuide");
        const quiz = activities.find((a) => a.moduleId === mid && a.type === "practiceQuiz");
        const deck = activities.find((a) => a.moduleId === mid && a.type === "flashcardSet");
        const guideContent = guide?.content as Record<string, unknown> | undefined;
        if (!guideContent?.sections || !(guideContent.sections as unknown[]).length) {
          issues.push(`Module "${mod.name}" needs learning guide sections.`);
        }
        const bank = (quiz?.content as Record<string, unknown> | undefined)?.questionBank;
        if (!Array.isArray(bank) || bank.length < 1) {
          issues.push(`Module "${mod.name}" needs practice questions.`);
        }
        const deckCards = cards.filter((c) => c.activityId === deck?.activityId);
        if (!deckCards.length) issues.push(`Module "${mod.name}" needs flashcards.`);
      }
      if (issues.length) {
        return Response.json({ error: { message: issues.join(" ") } }, { status: 400 });
      }

      const now = Date.now();
      const tags = (journey.tags as string[]) ?? ["AP"];
      await base44.entities.Journey.update(journey.id, {
        isPublic: true,
        isVeridianCertified: true,
        isAdminAuthored: true,
        publishStatus: "published",
        publishedAt: journey.publishedAt ?? now,
        creatorUsername: "Veridian",
        updatedAt: now,
        tags,
      });

      for (const mod of modules) {
        await base44.entities.Module.update(mod.id, { libraryVisible: true });
      }
      for (const act of activities) {
        if (act.moduleId) {
          await base44.entities.Activity.update(act.id, { libraryVisible: true, status: "ready" });
        }
      }

      try {
        await base44.entities.AdminAuditLog.create({
          action: "publish",
          adminEmail,
          detail: journeyId,
          createdAt: now,
        });
      } catch { /* optional */ }

      return Response.json({ data: { ok: true } });
    }

    if (action === "unpublish") {
      const now = Date.now();
      await base44.entities.Journey.update(journey.id, {
        isPublic: false,
        publishStatus: "draft",
        updatedAt: now,
      });
      for (const mod of modules) {
        await base44.entities.Module.update(mod.id, { libraryVisible: false });
      }
      for (const act of activities) {
        if (act.moduleId) {
          await base44.entities.Activity.update(act.id, { libraryVisible: false });
        }
      }
      return Response.json({ data: { ok: true } });
    }

    return Response.json({ error: { message: "Unknown action" } }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
