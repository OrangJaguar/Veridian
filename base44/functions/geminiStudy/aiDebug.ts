/** Source copy for merge into entry.ts — not imported at runtime on Base44. */

export type AiDebugStep = {
  at: string;
  step: string;
  ok: boolean;
  ms?: number;
  detail?: Record<string, unknown>;
  error?: string;
};

export type AiDebugSnapshot = {
  enabled: boolean;
  steps: AiDebugStep[];
  lastRawGeminiText: string | null;
  lastParsedShape: Record<string, unknown> | null;
};

export function createAiDebugTrace(enabled: boolean) {
  const steps: AiDebugStep[] = [];
  let lastRawGeminiText: string | null = null;
  let lastParsedShape: Record<string, unknown> | null = null;

  return {
    enabled,
    steps,
    get lastRawGeminiText() {
      return lastRawGeminiText;
    },
    setRawGeminiText(text: string) {
      if (!enabled) return;
      lastRawGeminiText = text;
    },
    setParsedShape(value: unknown) {
      if (!enabled) return;
      lastParsedShape = payloadShapeSummary(value);
    },
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
    snapshot(): AiDebugSnapshot {
      return {
        enabled,
        steps,
        lastRawGeminiText,
        lastParsedShape,
      };
    },
  };
}

export function stripDebugFlags(payload: Record<string, unknown>) {
  const rawDumpOnly = Boolean(payload.__rawDump);
  const debugEnabled = Boolean(payload.__debug) || rawDumpOnly;
  const clean = { ...payload };
  delete clean.__debug;
  delete clean.__rawDump;
  return { debugEnabled, rawDumpOnly, cleanPayload: clean };
}

/** @deprecated use stripDebugFlags */
export function stripDebugFlag(payload: Record<string, unknown>) {
  const { debugEnabled, cleanPayload } = stripDebugFlags(payload);
  return { debugEnabled, cleanPayload };
}

export function zodIssueSummary(err: unknown) {
  if (!err || typeof err !== "object" || !("issues" in err)) return undefined;
  const issues = (err as { issues: Array<{ path: (string | number)[]; message: string }> }).issues;
  return issues.slice(0, 8).map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/** Gemma 4 may return internal "thought" parts — exclude them from JSON extraction. */
export function extractModelResponseText(response: {
  text: () => string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
}): string {
  const parts = response.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts) && parts.length) {
    const visible = parts
      .filter((part) => !part.thought && typeof part.text === "string")
      .map((part) => part.text as string)
      .join("");
    if (visible) return visible;
  }
  return response.text();
}

export function payloadShapeSummary(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sampleKeys: value[0] && typeof value[0] === "object"
        ? Object.keys(value[0] as object).slice(0, 12)
        : [],
    };
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
