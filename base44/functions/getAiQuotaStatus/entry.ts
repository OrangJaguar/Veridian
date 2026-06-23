import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const STUDY_LIMITS = {
  quizGenerationsPerDay: 20,
  guideGenerationsPerDay: 10,
  gradingCallsPerDay: 30,
  flashcardGenerationsPerDay: 15,
  maxInputTokensPerDay: 200_000,
};

const JOURNEY_LIMITS = {
  journeyProposalsPerDay: 5,
  scaffoldRegeneratesPerDay: 10,
};

type QuotaRow = {
  journeyProposals?: number;
  scaffoldRegenerates?: number;
  inputTokens?: number;
  quizGenerations?: number;
  guideGenerations?: number;
  gradingCalls?: number;
  flashcardGenerations?: number;
};

function utcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function nextUtcMidnightMs() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
}

function computeQuotaStatus(quota: QuotaRow) {
  const buckets = [
    {
      key: "quiz",
      label: "Quiz & practice generations",
      used: quota.quizGenerations ?? 0,
      limit: STUDY_LIMITS.quizGenerationsPerDay,
    },
    {
      key: "guide",
      label: "Learning guide generations",
      used: quota.guideGenerations ?? 0,
      limit: STUDY_LIMITS.guideGenerationsPerDay,
    },
    {
      key: "flashcard",
      label: "Flashcard generations",
      used: quota.flashcardGenerations ?? 0,
      limit: STUDY_LIMITS.flashcardGenerationsPerDay,
    },
    {
      key: "grading",
      label: "AI grading calls",
      used: quota.gradingCalls ?? 0,
      limit: STUDY_LIMITS.gradingCallsPerDay,
    },
    {
      key: "journey",
      label: "Journey creations",
      used: quota.journeyProposals ?? 0,
      limit: JOURNEY_LIMITS.journeyProposalsPerDay,
    },
    {
      key: "regenerate",
      label: "Module regenerations",
      used: quota.scaffoldRegenerates ?? 0,
      limit: JOURNEY_LIMITS.scaffoldRegeneratesPerDay,
    },
    {
      key: "tokens",
      label: "Daily capacity",
      used: quota.inputTokens ?? 0,
      limit: STUDY_LIMITS.maxInputTokensPerDay,
      hidden: true,
    },
  ];

  const categories = buckets.map((bucket) => {
    const remaining = Math.max(0, bucket.limit - bucket.used);
    const percentRemaining = bucket.limit > 0
      ? Math.round((remaining / bucket.limit) * 100)
      : 100;
    return {
      key: bucket.key,
      label: bucket.label,
      used: bucket.used,
      limit: bucket.limit,
      remaining,
      percentRemaining,
      hidden: bucket.hidden === true,
    };
  });

  const visible = categories.filter((c) => !c.hidden);
  const totalRemaining = visible.reduce((sum, c) => sum + c.remaining, 0);
  const totalLimit = visible.reduce((sum, c) => sum + c.limit, 0);
  const budgetPercentRemaining = Math.min(...categories.map((c) => c.percentRemaining));

  let status: "ok" | "low" | "exhausted" = "ok";
  if (budgetPercentRemaining <= 0) status = "exhausted";
  else if (budgetPercentRemaining <= 25) status = "low";

  return {
    dateKey: utcDateKey(),
    resetsAt: nextUtcMidnightMs(),
    status,
    budgetPercentRemaining,
    totalRemaining,
    totalLimit,
    categories: visible,
    tokenUsed: quota.inputTokens ?? 0,
    tokenLimit: STUDY_LIMITS.maxInputTokensPerDay,
  };
}

async function getOrCreateQuota(base44: ReturnType<typeof createClientFromRequest>, userEmail: string) {
  const dateKey = utcDateKey();
  const rows = await base44.entities.UserAiQuota.filter({ userEmail, dateKey });
  if (rows[0]) return rows[0];

  return base44.entities.UserAiQuota.create({
    userEmail,
    dateKey,
    journeyProposals: 0,
    scaffoldRegenerates: 0,
    inputTokens: 0,
    lastCallAt: 0,
    quizGenerations: 0,
    guideGenerations: 0,
    gradingCalls: 0,
    flashcardGenerations: 0,
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.email) {
      return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
    }

    const quota = await getOrCreateQuota(base44, user.email);
    return Response.json(computeQuotaStatus(quota));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load AI quota";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
