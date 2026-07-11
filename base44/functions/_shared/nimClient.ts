/**
 * Nvidia Build (NIM) chat-completions client — OpenAI-compatible API.
 *
 * Two model tiers:
 *   heavy → AI_HEAVY_MODEL (default deepseek-ai/deepseek-v4-pro)
 *   light → AI_LIGHT_MODEL (default deepseek-ai/deepseek-v4-flash)
 *
 * Secrets (base44 secrets set --env-file .env.secrets):
 *   NVIDIA_API_KEY        — required
 *   NVIDIA_API_KEY_LIGHT  — optional, falls back to NVIDIA_API_KEY
 *   NVIDIA_NIM_BASE_URL   — optional, defaults to https://integrate.api.nvidia.com/v1
 */

export type ModelTier = "heavy" | "light";

const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";
const DEFAULT_HEAVY_MODEL = "deepseek-ai/deepseek-v4-pro";
const DEFAULT_LIGHT_MODEL = "deepseek-ai/deepseek-v4-flash";

export class NimConfigError extends Error {
  status = 503;
}

export class NimRateLimitError extends Error {
  status = 429;
  retryAfterSeconds: number | null;
  constructor(message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function resolveModelForTier(tier: ModelTier): string {
  if (tier === "light") {
    return Deno.env.get("AI_LIGHT_MODEL")?.trim() || DEFAULT_LIGHT_MODEL;
  }
  return Deno.env.get("AI_HEAVY_MODEL")?.trim() || DEFAULT_HEAVY_MODEL;
}

function resolveApiKey(tier: ModelTier): string {
  const heavyKey = Deno.env.get("NVIDIA_API_KEY")?.trim();
  const lightKey = Deno.env.get("NVIDIA_API_KEY_LIGHT")?.trim();
  const key = tier === "light" ? (lightKey || heavyKey) : heavyKey;
  if (!key) {
    throw new NimConfigError(
      "NVIDIA_API_KEY is not configured on the server. Run: base44 secrets set NVIDIA_API_KEY=nvapi-...",
    );
  }
  return key;
}

function resolveBaseUrl(): string {
  return Deno.env.get("NVIDIA_NIM_BASE_URL")?.trim() || DEFAULT_BASE_URL;
}

export interface ChatCompletionParams {
  tier: ModelTier;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  /** Optional prior conversation turns inserted between system and final user message. */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface ChatCompletionResult {
  text: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Strip <think>...</think> reasoning blocks (DeepSeek/thinking models) and
 * markdown code fences so downstream JSON.parse sees clean content.
 */
export function stripModelDecorations(raw: string): string {
  let text = String(raw ?? "");
  text = text.replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, "");
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

/** Extract the outermost JSON object from model text output. */
export function extractJsonText(raw: string): string {
  const trimmed = stripModelDecorations(raw);
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export async function chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
  const {
    tier,
    system,
    user,
    maxTokens = 4096,
    temperature = 0.1,
    jsonMode = true,
    history = [],
  } = params;

  const apiKey = resolveApiKey(tier);
  const model = resolveModelForTier(tier);
  const baseUrl = resolveBaseUrl();

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: system },
    ...history,
    { role: "user", content: user },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  };
  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After"));
    throw new NimRateLimitError(
      "AI provider is busy (rate limited). Please wait a moment and try again.",
      Number.isFinite(retryAfter) ? retryAfter : null,
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new NimConfigError("NVIDIA_API_KEY was rejected by the AI provider. Check the key in Base44 secrets.");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const errBody = await res.json();
      detail = errBody?.error?.message ?? errBody?.detail ?? "";
    } catch {
      // non-JSON error body
    }
    throw new Error(`AI provider error (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  return {
    text,
    model,
    usage: {
      inputTokens: data?.usage?.prompt_tokens ?? estimateTokens(system + user),
      outputTokens: data?.usage?.completion_tokens ?? estimateTokens(text),
    },
  };
}
