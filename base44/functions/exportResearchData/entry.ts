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
  const role = (user as { role?: string }).role;
  if (role !== "admin") {
    return { error: Response.json({ error: { message: "Forbidden" } }, { status: 403 }) };
  }
  return { user };
}

function getResearchSalt(): string {
  const salt = Deno.env.get("RESEARCH_SALT")?.trim();
  if (!salt) {
    throw new Error(
      "RESEARCH_SALT is not configured. Set it in Base44 secrets: base44 secrets set RESEARCH_SALT=<random-string>",
    );
  }
  return salt;
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashEmailToAnonId(email: string, salt: string): Promise<string> {
  const normalized = String(email ?? "").trim().toLowerCase();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(normalized),
  );
  return toHex(signature);
}

async function buildAnonMap(emails: Iterable<string>) {
  const salt = getResearchSalt();
  const map: Record<string, string> = {};
  const unique = [...new Set(emails)].filter(Boolean);
  await Promise.all(
    unique.map(async (email) => {
      map[email] = await hashEmailToAnonId(email, salt);
    }),
  );
  return map;
}

const QUIZ_TYPES = new Set([
  "practiceQuiz",
  "diagnostic",
  "interleavedReview",
  "journeyChallenge",
  "cramSession",
]);

function csvEscape(val: unknown) {
  const s = val == null ? "" : String(val);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: string[][]) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function sessionBrier(sliderValue: unknown, score: unknown) {
  if (sliderValue == null || score == null) return null;
  const predicted = Number(sliderValue) / 100;
  const actual = Number(score) >= 70 ? 1 : 0;
  return (predicted - actual) ** 2;
}

function meanBrier(sessions: Array<Record<string, unknown>>) {
  const vals = sessions
    .map((s) => {
      const sd = s.sessionData as Record<string, unknown> | undefined;
      const slider = (sd?.confidenceSlider as { value?: number } | undefined)?.value;
      return sessionBrier(slider, s.score);
    })
    .filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
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
    const [prefs, modules, sessions, journeys, snapshots, surveys] = await Promise.all([
      entities.UserPreferences.list(),
      entities.Module.list(),
      entities.Session.list(),
      entities.Journey.list(),
      entities.MasterySnapshot.list(),
      entities.SurveyResponse.list(),
    ]);

    const prefsArr = prefs as Array<Record<string, unknown>>;
    const modulesArr = modules as Array<Record<string, unknown>>;
    const sessionsArr = sessions as Array<Record<string, unknown>>;
    const journeysArr = journeys as Array<Record<string, unknown>>;
    const snapshotsArr = snapshots as Array<Record<string, unknown>>;
    const surveysArr = surveys as Array<Record<string, unknown>>;

    const emails = [
      ...new Set([
        ...prefsArr.map((p) => String(p.userEmail ?? "")),
        ...modulesArr.map((m) => String(m.userEmail ?? "")),
        ...sessionsArr.map((s) => String(s.userEmail ?? "")),
      ].filter(Boolean)),
    ];
    const anonMap = await buildAnonMap(emails);

    let csv = "";
    let filename = "research_export.csv";

    if (exportKey === "qualifyingPairs") {
      filename = "qualifying_pairs.csv";
      const journeyById: Record<string, Record<string, unknown>> = {};
      for (const j of journeysArr) journeyById[String(j.journeyId)] = j;
      const prefsByEmail: Record<string, Record<string, unknown>> = {};
      for (const p of prefsArr) prefsByEmail[String(p.userEmail)] = p;

      const pairSessions: Record<string, Array<Record<string, unknown>>> = {};
      for (const s of sessionsArr) {
        if (s.status !== "completed" || !QUIZ_TYPES.has(String(s.activityType))) continue;
        const email = String(s.userEmail ?? "");
        const mid = String(s.moduleId ?? "");
        if (!email || !mid) continue;
        const key = `${email}::${mid}`;
        pairSessions[key] = pairSessions[key] ?? [];
        pairSessions[key].push(s);
      }

      const header = [
        "anonymized_user_id",
        "module_subject",
        "journey_title",
        "sessions_completed",
        "baseline_score",
        "current_mastery",
        "day_7_snapshot_mastery",
        "day_30_snapshot_mastery",
        "day_60_snapshot_mastery",
        "mean_brier_score",
        "active_at_day_60",
        "mai_onboarding_score",
        "mai_day_60_score",
      ];
      const rows: string[][] = [];

      for (const [key, sessList] of Object.entries(pairSessions)) {
        if (sessList.length < 10) continue;
        const [email, moduleId] = key.split("::");
        const mod = modulesArr.find((m) => m.moduleId === moduleId && m.userEmail === email);
        if (!mod) continue;
        const journey = journeyById[String(mod.journeyId)] ?? {};
        const pref = prefsByEmail[email] ?? {};
        const modSnaps = snapshotsArr.filter(
          (sn) => sn.userEmail === email && sn.moduleId === moduleId,
        );
        const snapByDay = (day: number) =>
          modSnaps.find((sn) => Number(sn.snapshotDay) === day)?.masteryScore ?? "";
        const day60Snap = modSnaps.find((sn) => Number(sn.snapshotDay) === 60);
        const brier = meanBrier(sessList);

        rows.push([
          String(anonMap[email]),
          String(journey.subject ?? ""),
          String(journey.title ?? ""),
          String(sessList.length),
          String(mod.baselineScore ?? ""),
          String(mod.masteryScore ?? ""),
          String(snapByDay(7)),
          String(snapByDay(30)),
          String(snapByDay(60)),
          brier != null ? String(brier) : "",
          day60Snap ? String(Boolean(day60Snap.isActiveAtSnapshot)) : "",
          String(pref.maiScoreOnboarding ?? ""),
          String(pref.maiScoreDay60 ?? ""),
        ]);
      }
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "sessions") {
      filename = "sessions.csv";
      const header = [
        "anonymized_user_id",
        "module_id",
        "journey_id",
        "activity_type",
        "started_at",
        "ended_at",
        "duration_sec",
        "score",
        "confidence_slider_value",
        "confidence_slider_submitted_at",
      ];
      const rows = sessionsArr
        .filter((s) => s.status === "completed")
        .map((s) => {
          const email = String(s.userEmail ?? "");
          const sd = s.sessionData as Record<string, unknown> | undefined;
          const slider = sd?.confidenceSlider as { value?: number; submittedAt?: string } | undefined;
          return [
            String(anonMap[email] ?? ""),
            String(s.moduleId ?? ""),
            String(s.journeyId ?? ""),
            String(s.activityType ?? ""),
            s.startedAt ? new Date(Number(s.startedAt)).toISOString() : "",
            s.endedAt ? new Date(Number(s.endedAt)).toISOString() : "",
            String(s.durationSec ?? ""),
            String(s.score ?? ""),
            slider?.value != null ? String(slider.value) : "",
            slider?.submittedAt ?? "",
          ];
        });
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "masterySnapshots") {
      filename = "mastery_snapshots.csv";
      const header = [
        "anonymized_user_id",
        "module_id",
        "journey_id",
        "snapshot_day",
        "mastery_score",
        "session_count",
        "total_study_minutes",
        "is_active_at_snapshot",
        "days_late",
        "captured_at",
      ];
      const rows = snapshotsArr.map((sn) => [
        String(anonMap[String(sn.userEmail ?? "")] ?? ""),
        String(sn.moduleId ?? ""),
        String(sn.journeyId ?? ""),
        String(sn.snapshotDay ?? ""),
        String(sn.masteryScore ?? ""),
        String(sn.sessionCount ?? ""),
        String(sn.totalStudyMinutes ?? ""),
        String(Boolean(sn.isActiveAtSnapshot)),
        String(sn.daysLate ?? 0),
        sn.capturedAt ? new Date(Number(sn.capturedAt)).toISOString() : "",
      ]);
      csv = toCsv([header, ...rows]);
    } else if (exportKey === "surveyResponses") {
      filename = "survey_responses.csv";
      const header = [
        "anonymized_user_id",
        "survey_version",
        "survey_instance",
        "total_score",
        "account_age_days",
        "was_skipped",
        "created_at",
        "responses_json",
      ];
      const rows = surveysArr.map((sr) => [
        String(anonMap[String(sr.userEmail ?? "")] ?? ""),
        String(sr.surveyVersion ?? ""),
        String(sr.surveyInstance ?? ""),
        String(sr.totalScore ?? ""),
        String(sr.accountAgeDays ?? ""),
        String(Boolean(sr.wasSkipped)),
        sr.createdAt ? new Date(Number(sr.createdAt)).toISOString() : "",
        JSON.stringify(sr.responses ?? []),
      ]);
      csv = toCsv([header, ...rows]);
    } else {
      return Response.json({ error: { message: `Unknown exportKey: ${exportKey}` } }, { status: 400 });
    }

    try {
      await base44.entities.AdminAuditLog.create({
        logId: crypto.randomUUID(),
        adminEmail,
        action: `exportResearchData:${exportKey}`,
        createdAt: Date.now(),
      });
    } catch {
      // audit optional
    }

    return Response.json({ data: { csv, filename } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("RESEARCH_SALT") ? 503 : 500;
    return Response.json({ error: { message } }, { status });
  }
});
