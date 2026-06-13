export type AiDebugStep = {
  at: string;
  step: string;
  ok: boolean;
  ms?: number;
  detail?: Record<string, unknown>;
  error?: string;
};

export type AiDebugTrace = {
  enabled: boolean;
  steps: AiDebugStep[];
};

export function createAiDebugTrace(enabled: boolean) {
  const steps: AiDebugStep[] = [];
  return {
    enabled,
    steps,
    record(
      step: string,
      ok: boolean,
      detail?: Record<string, unknown>,
      error?: string,
      ms?: number,
    ) {
      if (!enabled) return;
      steps.push({
        at: new Date().toISOString(),
        step,
        ok,
        ...(ms != null ? { ms } : {}),
        ...(detail ? { detail } : {}),
        ...(error ? { error } : {}),
      });
    },
  };
}

export function stripDebugFlag(payload: Record<string, unknown>) {
  const debugEnabled = Boolean(payload.__debug);
  const clean = { ...payload };
  delete clean.__debug;
  return { debugEnabled, cleanPayload: clean };
}

export function zodIssueSummary(err: unknown) {
  if (!err || typeof err !== "object" || !("issues" in err)) return undefined;
  const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
  return issues.slice(0, 8).map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

export function payloadShapeSummary(value: unknown) {
  if (Array.isArray(value)) {
    return { type: "array", length: value.length, sampleKeys: value[0] && typeof value[0] === "object"
      ? Object.keys(value[0] as object).slice(0, 12)
      : [] };
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return {
      type: "object",
      keys: Object.keys(obj).slice(0, 20),
      questions: Array.isArray(obj.questions) ? obj.questions.length : undefined,
      sections: Array.isArray(obj.sections) ? obj.sections.length : undefined,
      cards: Array.isArray(obj.cards) ? obj.cards.length : undefined,
    };
  }
  return { type: typeof value };
}
