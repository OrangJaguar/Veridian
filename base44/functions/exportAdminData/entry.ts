import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

type Base44Client = ReturnType<typeof createClientFromRequest>;

function serviceEntities(base44: Base44Client) {
  if (!base44.asServiceRole) {
    throw new Error("Service role is not available in this context.");
  }
  return base44.asServiceRole.entities;
}

async function requireAdmin(base44: Base44Client) {
  const user = await base44.auth.me();
  if (!user?.email) {
    return { error: Response.json({ error: { message: "Unauthorized" } }, { status: 401 }) };
  }
  if ((user as { role?: string }).role !== "admin") {
    return { error: Response.json({ error: { message: "Forbidden" } }, { status: 403 }) };
  }
  return { user };
}

function csvEscape(val: unknown) {
  const s = val == null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: string[][]) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function journeyCountByEmail(journeys: Array<Record<string, unknown>>) {
  const map: Record<string, number> = {};
  for (const j of journeys) {
    const e = String(j.userEmail ?? "");
    if (e) map[e] = (map[e] ?? 0) + 1;
  }
  return map;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const exportKey = String(body.exportKey ?? "");
    const adminEmail = (auth.user as { email?: string }).email ?? "";

    const entities = serviceEntities(base44);
    const [prefs, journeys, sessions, modules] = await Promise.all([
      entities.UserPreferences.list(),
      entities.Journey.list(),
      entities.Session.list(),
      entities.Module.list(),
    ]);

    const prefsArr = prefs as Array<Record<string, unknown>>;
    const journeysArr = journeys as Array<Record<string, unknown>>;
    const sessionsArr = sessions as Array<Record<string, unknown>>;
    const modulesArr = modules as Array<Record<string, unknown>>;
    const journeyCounts = journeyCountByEmail(journeysArr);

    let csv = "";
    let filename = "export.csv";

    if (exportKey === "users") {
      filename = "users.csv";
      const header = ["email", "username", "signupDate", "journeyCount", "lastActiveDate"];
      const rows = prefsArr.map((p) => {
        const email = String(p.userEmail ?? "");
        const created = p.createdAt ? new Date(Number(p.createdAt)).toISOString() : "";
        const last = p.lastActiveAt ? new Date(Number(p.lastActiveAt)).toISOString() : "";
        return [email, String(p.username ?? ""), created, String(journeyCounts[email] ?? 0), last];
      });
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "journeys") {
      filename = "journeys.csv";
      const modCounts: Record<string, number> = {};
      for (const m of modulesArr) {
        const jid = String(m.journeyId ?? "");
        modCounts[jid] = (modCounts[jid] ?? 0) + 1;
      }
      const header = ["title", "subject", "creator", "createdDate", "moduleCount", "isPublic", "isVeridianCertified"];
      const rows = journeysArr.map((j) => [
        String(j.title ?? ""),
        String(j.subject ?? ""),
        String(j.creatorUsername ?? j.userEmail ?? ""),
        j.createdAt ? new Date(Number(j.createdAt)).toISOString() : "",
        String(modCounts[String(j.journeyId)] ?? 0),
        String(Boolean(j.isPublic)),
        String(Boolean(j.isVeridianCertified)),
      ]);
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "quizSessions") {
      filename = "quiz_sessions.csv";
      const header = ["userEmail", "journeyId", "moduleId", "score", "date", "questionCount"];
      const rows = sessionsArr
        .filter((s) => s.activityType === "practiceQuiz" && s.status === "completed")
        .map((s) => {
          const sd = s.sessionData as Record<string, unknown> | undefined;
          const qCount = Array.isArray(sd?.questions) ? sd!.questions.length : (sd?.answers ? (sd.answers as unknown[]).length : 0);
          return [
            String(s.userEmail ?? ""),
            String(s.journeyId ?? ""),
            String(s.moduleId ?? ""),
            String(s.score ?? ""),
            s.endedAt ? new Date(Number(s.endedAt)).toISOString() : "",
            String(qCount),
          ];
        });
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "flashcardSessions") {
      filename = "flashcard_sessions.csv";
      const header = ["userEmail", "moduleId", "cardsReviewed", "accuracy", "date"];
      const rows = sessionsArr
        .filter((s) => s.activityType === "flashcardSet" && s.status === "completed")
        .map((s) => [
          String(s.userEmail ?? ""),
          String(s.moduleId ?? ""),
          String(s.questionsAnswered ?? s.sessionData?.cardsReviewed ?? ""),
          String(s.accuracyPercent ?? s.outcomeSummary?.accuracy ?? ""),
          s.endedAt ? new Date(Number(s.endedAt)).toISOString() : "",
        ]);
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "mastery") {
      filename = "mastery.csv";
      const header = ["userEmail", "journeyId", "moduleId", "moduleName", "masteryScore"];
      const rows = modulesArr.map((m) => [
        String(m.userEmail ?? ""),
        String(m.journeyId ?? ""),
        String(m.moduleId ?? ""),
        String(m.name ?? ""),
        String(m.masteryScore ?? 0),
      ]);
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "eventLog") {
      filename = "event_log.csv";
      const header = ["sessionId", "userEmail", "activityType", "status", "score", "startedAt", "endedAt"];
      const rows = sessionsArr.map((s) => [
        String(s.sessionId ?? ""),
        String(s.userEmail ?? ""),
        String(s.activityType ?? ""),
        String(s.status ?? ""),
        String(s.score ?? ""),
        s.startedAt ? new Date(Number(s.startedAt)).toISOString() : "",
        s.endedAt ? new Date(Number(s.endedAt)).toISOString() : "",
      ]);
      csv = toCsv([header, ...rows]);
    } else {
      return Response.json({ error: { message: "Unknown export key" } }, { status: 400 });
    }

    try {
      await base44.entities.AdminAuditLog.create({
        action: "export",
        adminEmail,
        detail: exportKey,
        createdAt: Date.now(),
      });
    } catch { /* optional */ }

    return Response.json({ data: { csv, filename } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
