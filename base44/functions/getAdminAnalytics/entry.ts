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

function utcDayKey(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
}

function matchQuery(question: string) {
  const q = question.toLowerCase().trim();
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q) && /week/.test(q)) return "signupsWeek";
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q) && /month/.test(q)) return "signupsMonth";
  if (/sign(ed)?\s*up|registration|new\s+user/.test(q)) return "signupsTotal";
  if (/popular|most\s+common/.test(q) && /subject/.test(q)) return "popularSubject";
  if (/average|avg/.test(q) && /mastery/.test(q)) return "avgMastery";
  if (/quiz/.test(q) && /yesterday/.test(q)) return "quizYesterday";
  if (/quiz/.test(q) && /session|completed/.test(q)) return "quizTotal";
  if (/flashcard/.test(q) && /session/.test(q)) return "flashcardTotal";
  if (/feynman/.test(q)) return "feynmanTotal";
  if (/free\s*recall/.test(q)) return "freeRecallTotal";
  if (/learning\s*guide/.test(q)) return "guideTotal";
  if (/how\s+many\s+user|total\s+user|registered/.test(q)) return "totalUsers";
  if (/active/.test(q) && /7/.test(q)) return "active7";
  if (/active/.test(q) && /30/.test(q)) return "active30";
  if (/journey/.test(q) && /how\s+many|total|count/.test(q)) return "totalJourneys";
  if (/module/.test(q) && /how\s+many|total|count/.test(q)) return "totalModules";
  if (/lowest|completion|complete/.test(q) && /module/.test(q)) return "lowCompletionModules";
  return "unknown";
}

/** Strip control characters and limit length to prevent query manipulation. */
function sanitizeQuestion(raw: string): string {
  return String(raw ?? "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 300);
}

async function loadAll(base44: ReturnType<typeof createClientFromRequest>) {
  const [prefs, journeys, modules, sessions, activities, productEvents] = await Promise.all([
    base44.entities.UserPreferences.list(),
    base44.entities.Journey.list(),
    base44.entities.Module.list(),
    base44.entities.Session.list(),
    base44.entities.Activity.list(),
    base44.entities.ProductEvent.list().catch(() => []),
  ]);
  return {
    prefs: prefs as Array<Record<string, unknown>>,
    journeys: journeys as Array<Record<string, unknown>>,
    modules: modules as Array<Record<string, unknown>>,
    sessions: sessions as Array<Record<string, unknown>>,
    activities: activities as Array<Record<string, unknown>>,
    productEvents: productEvents as Array<Record<string, unknown>>,
  };
}

function uniqueUsers(prefs: Array<Record<string, unknown>>, journeys: Array<Record<string, unknown>>) {
  const emails = new Set<string>();
  for (const p of prefs) {
    if (typeof p.userEmail === "string") emails.add(p.userEmail);
  }
  for (const j of journeys) {
    if (typeof j.userEmail === "string") emails.add(j.userEmail);
  }
  return emails;
}

function activeUsers(prefs: Array<Record<string, unknown>>, sinceMs: number) {
  return prefs.filter((p) => {
    const la = Number(p.lastActiveAt ?? p.updatedAt ?? 0);
    return la >= sinceMs;
  }).length;
}

function completedSessions(sessions: Array<Record<string, unknown>>, type?: string, sinceMs?: number) {
  return sessions.filter((s) => {
    if (s.status !== "completed") return false;
    if (type && s.activityType !== type) return false;
    if (sinceMs != null) {
      const ended = Number(s.endedAt ?? s.startedAt ?? 0);
      if (ended < sinceMs) return false;
    }
    return true;
  }).length;
}

function avgMastery(modules: Array<Record<string, unknown>>) {
  const scores = modules.map((m) => Number(m.masteryScore ?? 0)).filter((n) => n > 0);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function popularSubject(journeys: Array<Record<string, unknown>>) {
  const counts: Record<string, number> = {};
  for (const j of journeys) {
    const s = String(j.subject ?? "Unknown");
    counts[s] = (counts[s] ?? 0) + 1;
  }
  let best = "—";
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) { max = v; best = k; }
  }
  return best;
}

function signupTrend(prefs: Array<Record<string, unknown>>) {
  const out: Array<{ date: string; label: string; count: number }> = [];
  for (let i = 29; i >= 0; i -= 1) {
    const dayStart = daysAgo(i);
    const key = utcDayKey(dayStart);
    const count = prefs.filter((p) => utcDayKey(Number(p.createdAt ?? 0)) === key).length;
    out.push({ date: key, label: key.slice(5), count });
  }
  return out;
}

function uniqueEventCount(events: Array<Record<string, unknown>>, eventName: string) {
  const ids = new Set<string>();
  for (const e of events) {
    if (e.event !== eventName) continue;
    ids.add(String(e.anonymousId ?? e.userEmail ?? e.id));
  }
  return ids.size;
}

function computeFunnel(data: Awaited<ReturnType<typeof loadAll>>) {
  const events = data.productEvents ?? [];
  const users = uniqueUsers(data.prefs, data.journeys);
  const registered = users.size;

  const onboardingDone = data.prefs.filter((p) => p.onboardingCompletedAt).length;
  const journeyUsers = new Set<string>();
  for (const j of data.journeys) {
    if (typeof j.userEmail === "string") journeyUsers.add(j.userEmail);
  }

  const sessionUsers = new Set<string>();
  for (const s of data.sessions) {
    if (s.status === "completed" && typeof s.userEmail === "string") {
      sessionUsers.add(s.userEmail);
    }
  }

  const weekAgo = daysAgo(7);
  const d7Retained = data.prefs.filter((p) => {
    const created = Number(p.createdAt ?? 0);
    const last = Number(p.lastActiveAt ?? 0);
    return created > 0 && created <= weekAgo && last >= weekAgo;
  }).length;

  const cohortD7Eligible = data.prefs.filter((p) => {
    const created = Number(p.createdAt ?? 0);
    return created > 0 && created <= weekAgo;
  }).length;

  const preSignupSteps = [
    { key: "landing_view", label: "Landing page views", count: uniqueEventCount(events, "landing_view") },
    { key: "baseline_start", label: "Baseline started", count: uniqueEventCount(events, "baseline_start") },
    { key: "baseline_screen_4_start", label: "Reached recall screen", count: uniqueEventCount(events, "baseline_screen_4_start") },
    { key: "baseline_complete", label: "Baseline completed", count: uniqueEventCount(events, "baseline_complete_pass") + uniqueEventCount(events, "baseline_complete_fail") },
    { key: "baseline_unlock", label: "Landing unlocked", count: uniqueEventCount(events, "baseline_unlock") },
    { key: "signup_click", label: "Signup clicks", count: uniqueEventCount(events, "signup_click") },
    { key: "signup_start", label: "Signup page visits", count: uniqueEventCount(events, "signup_start") },
  ];

  const postSignupSteps = [
    { key: "registered", label: "Accounts created", count: registered },
    { key: "onboarding", label: "Onboarding completed", count: onboardingDone },
    { key: "journey", label: "Created a journey", count: journeyUsers.size },
    { key: "study", label: "Completed a study session", count: sessionUsers.size },
    { key: "d7", label: "Active 7+ days after signup", count: d7Retained },
  ];

  function withConversion(steps: Array<{ key: string; label: string; count: number }>) {
    const top = steps[0]?.count || 0;
    return steps.map((step, i) => ({
      ...step,
      conversionFromTop: top > 0 ? Math.round((step.count / top) * 100) : 0,
      dropFromPrev: i > 0 && steps[i - 1].count > 0
        ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)
        : 0,
    }));
  }

  const onboardingSteps = [0, 1, 2, 3, 4].map((step) => ({
    step,
    label: step === 0 ? "Welcome" : step === 4 ? "Research consent" : `Step ${step}`,
    count: data.prefs.filter((p) => {
      const completed = Number(p.onboardingCompletedAt ?? 0);
      const atStep = Number(p.onboardingStep ?? 0);
      if (completed) return true;
      return atStep >= step;
    }).length,
  }));

  return {
    preSignup: withConversion(preSignupSteps),
    postSignup: withConversion(postSignupSteps),
    onboardingSteps,
    d7RetentionRate: cohortD7Eligible > 0 ? Math.round((d7Retained / cohortD7Eligible) * 100) : null,
    eventTrackingActive: events.length > 0,
  };
}

function computeSummary(data: Awaited<ReturnType<typeof loadAll>>) {
  const now = Date.now();
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);
  const users = uniqueUsers(data.prefs, data.journeys);
  const guides = data.activities.filter(
    (a) => a.type === "learningGuide" && a.status === "ready",
  ).length;

  return {
    totalUsers: users.size,
    activeUsers7d: activeUsers(data.prefs, weekAgo),
    activeUsers30d: activeUsers(data.prefs, monthAgo),
    totalJourneys: data.journeys.length,
    totalModules: data.modules.length,
    quizSessionsCompleted: completedSessions(data.sessions, "practiceQuiz"),
    flashcardSessionsCompleted: completedSessions(data.sessions, "flashcardSet"),
    learningGuidesGenerated: guides,
    feynmanSessionsCompleted: completedSessions(data.sessions, "feynman"),
    freeRecallSessionsCompleted: completedSessions(data.sessions, "freeRecall"),
    averageMastery: avgMastery(data.modules),
    mostPopularSubject: popularSubject(data.journeys),
  };
}

function answerFromIntent(intent: string, data: Awaited<ReturnType<typeof loadAll>>) {
  const summary = computeSummary(data);
  const yesterday = daysAgo(1);
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  switch (intent) {
    case "signupsWeek": {
      const n = data.prefs.filter((p) => Number(p.createdAt ?? 0) >= weekAgo).length;
      return `${n} user(s) signed up in the last 7 days.`;
    }
    case "signupsMonth": {
      const n = data.prefs.filter((p) => Number(p.createdAt ?? 0) >= monthAgo).length;
      return `${n} user(s) signed up in the last 30 days.`;
    }
    case "signupsTotal":
      return `${summary.totalUsers} registered user(s) on the platform.`;
    case "popularSubject":
      return `The most popular subject is "${summary.mostPopularSubject}".`;
    case "avgMastery":
      return `Average mastery score across all modules is ${summary.averageMastery}%.`;
    case "quizYesterday": {
      const n = completedSessions(data.sessions, "practiceQuiz", yesterday);
      return `${n} quiz session(s) completed since yesterday.`;
    }
    case "quizTotal":
      return `${summary.quizSessionsCompleted} practice quiz session(s) completed in total.`;
    case "flashcardTotal":
      return `${summary.flashcardSessionsCompleted} flashcard session(s) completed in total.`;
    case "feynmanTotal":
      return `${summary.feynmanSessionsCompleted} Feynman session(s) completed in total.`;
    case "freeRecallTotal":
      return `${summary.freeRecallSessionsCompleted} free recall session(s) completed in total.`;
    case "guideTotal":
      return `${summary.learningGuidesGenerated} learning guide(s) marked ready.`;
    case "totalUsers":
      return `${summary.totalUsers} registered user(s).`;
    case "active7":
      return `${summary.activeUsers7d} user(s) active in the last 7 days.`;
    case "active30":
      return `${summary.activeUsers30d} user(s) active in the last 30 days.`;
    case "totalJourneys":
      return `${summary.totalJourneys} journey(ies) created.`;
    case "totalModules":
      return `${summary.totalModules} module(s) created.`;
    case "lowCompletionModules": {
      const byModule: Record<string, number> = {};
      for (const s of data.sessions) {
        if (s.status !== "completed" || !s.moduleId) continue;
        byModule[String(s.moduleId)] = (byModule[String(s.moduleId)] ?? 0) + 1;
      }
      const sorted = [...data.modules].sort(
        (a, b) => (byModule[String(a.moduleId)] ?? 0) - (byModule[String(b.moduleId)] ?? 0),
      );
      const bottom = sorted.slice(0, 5).map((m) =>
        `${m.name}: ${byModule[String(m.moduleId)] ?? 0} completed session(s)`
      );
      return bottom.length
        ? `Modules with fewest completed sessions:\n${bottom.join("\n")}`
        : "No module session data yet.";
    }
    default:
      return "I can answer questions about users, signups, journeys, modules, sessions, and mastery. Try: \"How many users signed up this week?\", \"What is the most popular subject?\", or \"What is the average mastery score?\"";
  }
}

const queryTimestamps = new Map<string, number[]>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function rateLimit(email: string) {
  const now = Date.now();
  const prev = (queryTimestamps.get(email) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (prev.length >= RATE_LIMIT) return false;
  prev.push(now);
  queryTimestamps.set(email, prev);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAdmin(base44);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "getSummaryStats";
    const data = await loadAll(base44);

    if (action === "getSummaryStats") {
      return Response.json({ data: computeSummary(data) });
    }

    if (action === "getSignupTrend") {
      return Response.json({ data: signupTrend(data.prefs) });
    }

    if (action === "getFunnelAnalytics") {
      return Response.json({ data: computeFunnel(data) });
    }

    if (action === "queryConversation") {
      const email = (auth.user as { email?: string }).email ?? "unknown";
      if (!rateLimit(email)) {
        return Response.json({ error: { message: "Rate limit exceeded. Try again shortly." } }, { status: 429 });
      }
      const question = sanitizeQuestion(body.question);
      if (!question) {
        return Response.json({ error: { message: "Question is required." } }, { status: 400 });
      }
      const intent = matchQuery(question);
      const answerText = answerFromIntent(intent, data);
      try {
        await base44.entities.AdminAuditLog.create({
          action: "queryConversation",
          adminEmail: email,
          detail: question.slice(0, 500),
          createdAt: Date.now(),
        });
      } catch { /* audit optional until entity exists */ }
      return Response.json({ data: { answerText, intent } });
    }

    return Response.json({ error: { message: "Unknown action" } }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: { message } }, { status: 500 });
  }
});