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
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

async function loadAll(base44: Base44Client) {
  const entities = serviceEntities(base44);
  const [prefs, modules, sessions, journeys, snapshots, surveys] = await Promise.all([
    entities.UserPreferences.list(),
    entities.Module.list(),
    entities.Session.list(),
    entities.Journey.list(),
    entities.MasterySnapshot.list(),
    entities.SurveyResponse.list(),
  ]);
  return {
    prefs: prefs as Array<Record<string, unknown>>,
    modules: modules as Array<Record<string, unknown>>,
    sessions: sessions as Array<Record<string, unknown>>,
    journeys: journeys as Array<Record<string, unknown>>,
    snapshots: snapshots as Array<Record<string, unknown>>,
    surveys: surveys as Array<Record<string, unknown>>,
  };
}

function getDataHealth(data: Awaited<ReturnType<typeof loadAll>>) {
  const { prefs, modules, sessions, snapshots } = data;
  const uniqueUsers = new Set(prefs.map((p) => p.userEmail).filter(Boolean));
  const completed = sessions.filter((s) => s.status === "completed");
  const quizCompleted = completed.filter((s) => QUIZ_TYPES.has(String(s.activityType)));
  const withSlider = quizCompleted.filter((s) => {
    const sd = s.sessionData as Record<string, unknown> | undefined;
    return (sd?.confidenceSlider as { value?: number } | undefined)?.value != null;
  });
  const withoutSlider = quizCompleted.length - withSlider.length;

  const modulesTotal = modules.length;
  const baselineSet = modules.filter((m) => m.baselineScore != null).length;
  const baselineSkipped = modules.filter((m) => m.baselineSkipped === true).length;

  const pastOnboarding = prefs.filter((p) => p.onboardingCompletedAt);
  const maiOnboarding = prefs.filter((p) => p.maiScoreOnboarding != null).length;
  const users60Plus = prefs.filter((p) => {
    const created = Number(p.createdAt ?? 0);
    return created && Date.now() - created >= 60 * MS_PER_DAY;
  });
  const maiDay60 = prefs.filter((p) => p.maiScoreDay60 != null).length;

  const qualifyingPairs = new Set<string>();
  const pairQuizSessions: Record<string, Array<Record<string, unknown>>> = {};
  for (const s of quizCompleted) {
    const email = String(s.userEmail ?? "");
    const mid = String(s.moduleId ?? "");
    if (!email || !mid) continue;
    const key = `${email}::${mid}`;
    pairQuizSessions[key] = pairQuizSessions[key] ?? [];
    pairQuizSessions[key].push(s);
    if (pairQuizSessions[key].length >= 10) qualifyingPairs.add(key);
  }

  let snapshotQualifying = 0;
  let snapshotWithDay7 = 0;
  const now = Date.now();
  for (const m of modules) {
    const firstQuizAt = Number(m.firstQuizAt ?? 0);
    if (!firstQuizAt || now - firstQuizAt < 7 * MS_PER_DAY) continue;
    snapshotQualifying += 1;
    const email = String(m.userEmail ?? "");
    const mid = String(m.moduleId ?? "");
    const has7 = data.snapshots.some(
      (sn) =>
        sn.userEmail === email
        && sn.moduleId === mid
        && Number(sn.snapshotDay) === 7,
    );
    if (has7) snapshotWithDay7 += 1;
  }

  return {
    totalUniqueUsers: uniqueUsers.size,
    totalSessionsCompleted: completed.length,
    quizSessionsWithConfidenceSlider: withSlider.length,
    quizSessionsWithoutConfidenceSlider: withoutSlider,
    baselineCompletionRate: modulesTotal ? baselineSet / modulesTotal : 0,
    baselineSkipRate: modulesTotal ? baselineSkipped / modulesTotal : 0,
    maiOnboardingCompletionRate: pastOnboarding.length
      ? maiOnboarding / pastOnboarding.length
      : 0,
    maiDay60CompletionRate: users60Plus.length ? maiDay60 / users60Plus.length : 0,
    masterySnapshotDay7Coverage: snapshotQualifying
      ? snapshotWithDay7 / snapshotQualifying
      : 0,
    qualifyingPairCount: qualifyingPairs.size,
  };
}

async function getQualifyingPairs(data: Awaited<ReturnType<typeof loadAll>>) {
  const { modules, sessions, journeys, snapshots, prefs } = data;
  const journeyById: Record<string, Record<string, unknown>> = {};
  for (const j of journeys) journeyById[String(j.journeyId)] = j;

  const prefsByEmail: Record<string, Record<string, unknown>> = {};
  for (const p of prefs) prefsByEmail[String(p.userEmail)] = p;

  const pairSessions: Record<string, Array<Record<string, unknown>>> = {};
  for (const s of sessions) {
    if (s.status !== "completed" || !QUIZ_TYPES.has(String(s.activityType))) continue;
    const email = String(s.userEmail ?? "");
    const mid = String(s.moduleId ?? "");
    if (!email || !mid) continue;
    const key = `${email}::${mid}`;
    pairSessions[key] = pairSessions[key] ?? [];
    pairSessions[key].push(s);
  }

  const emails = Object.keys(pairSessions).map((k) => k.split("::")[0]);
  const anonMap = await buildAnonMap(emails);
  const rows = [];

  for (const [key, sessList] of Object.entries(pairSessions)) {
    if (sessList.length < 10) continue;
    const [email, moduleId] = key.split("::");
    const mod = modules.find((m) => m.moduleId === moduleId && m.userEmail === email);
    if (!mod) continue;
    const journey = journeyById[String(mod.journeyId)] ?? {};
    const pref = prefsByEmail[email] ?? {};
    const modSnaps = snapshots.filter(
      (sn) => sn.userEmail === email && sn.moduleId === moduleId,
    );
    const snapByDay = (day: number) =>
      modSnaps.find((sn) => Number(sn.snapshotDay) === day)?.masteryScore ?? null;
    const day60Snap = modSnaps.find((sn) => Number(sn.snapshotDay) === 60);

    rows.push({
      anonymizedUserId: anonMap[email],
      moduleSubject: journey.subject ?? "",
      journeyTitle: journey.title ?? "",
      sessionsCompleted: sessList.length,
      baselineScore: mod.baselineScore ?? null,
      currentMastery: mod.masteryScore ?? null,
      day7SnapshotMastery: snapByDay(7),
      day30SnapshotMastery: snapByDay(30),
      day60SnapshotMastery: snapByDay(60),
      meanBrierScore: meanBrier(sessList),
      activeAtDay60: day60Snap?.isActiveAtSnapshot ?? null,
      maiOnboardingScore: pref.maiScoreOnboarding ?? null,
      maiDay60Score: pref.maiScoreDay60 ?? null,
    });
  }

  return rows.sort((a, b) => String(a.anonymizedUserId).localeCompare(String(b.anonymizedUserId)));
}

function getDataQualityFlags(data: Awaited<ReturnType<typeof loadAll>>) {
  const flags: Array<Record<string, unknown>> = [];
  const { modules, sessions, snapshots } = data;
  const now = Date.now();

  for (const s of sessions) {
    if (s.status !== "completed" || !QUIZ_TYPES.has(String(s.activityType))) continue;
    const sd = s.sessionData as Record<string, unknown> | undefined;
    const slider = sd?.confidenceSlider;
    if (!slider) {
      flags.push({
        type: "missing_confidence_slider",
        userEmail: s.userEmail,
        moduleId: s.moduleId,
        sessionId: s.sessionId,
        activityType: s.activityType,
      });
    }
  }

  for (const m of modules) {
    const email = String(m.userEmail ?? "");
    const mid = String(m.moduleId ?? "");
    const moduleSessions = sessions.filter(
      (s) => s.userEmail === email && s.moduleId === mid && s.status === "completed",
    );
    if (m.baselineScore == null && !m.baselineSkipped && moduleSessions.length > 3) {
      flags.push({
        type: "baseline_never_captured",
        userEmail: email,
        moduleId: mid,
        sessionCount: moduleSessions.length,
      });
    }

    const firstQuizAt = Number(m.firstQuizAt ?? 0);
    if (!firstQuizAt) continue;
    for (const day of [7, 30, 60]) {
      if (now - firstQuizAt < day * MS_PER_DAY) continue;
      const exists = snapshots.some(
        (sn) => sn.userEmail === email && sn.moduleId === mid && Number(sn.snapshotDay) === day,
      );
      if (!exists) {
        flags.push({
          type: "missing_mastery_snapshot",
          userEmail: email,
          moduleId: mid,
          snapshotDay: day,
        });
      }
    }
  }

  return flags;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "getDataHealth");
    const data = await loadAll(base44);

    if (action === "getDataHealth") {
      return Response.json({ data: getDataHealth(data) });
    }
    if (action === "getQualifyingPairs") {
      return Response.json({ data: await getQualifyingPairs(data) });
    }
    if (action === "getDataQualityFlags") {
      return Response.json({ data: getDataQualityFlags(data) });
    }
    if (action === "getAnonymizedUserMap") {
      const emails = [
        ...new Set([
          ...data.prefs.map((p) => String(p.userEmail ?? "")),
          ...data.modules.map((m) => String(m.userEmail ?? "")),
        ].filter(Boolean)),
      ];
      return Response.json({ data: await buildAnonMap(emails) });
    }

    return Response.json({ error: { message: `Unknown action: ${action}` } }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("RESEARCH_SALT") ? 503 : 500;
    return Response.json({ error: { message } }, { status });
  }
});
