/** Default per-chunk timeout before gateway 502. */
export const CHUNK_TIMEOUT_MS = 90_000;

/** Silent retries before surfacing error to user. */
export const CHUNK_MAX_ATTEMPTS = 3;

export const CHUNK_BACKOFF_MS = [2500, 5000];

export function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isAuthRefreshableError(err) {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  const message = err?.message ?? '';
  return err?.name === 'AuthRequiredError'
    || status === 401
    || /authentication required|please sign in/i.test(message);
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isQuotaOrRateLimitError(err) {
  const status = err?.status;
  const message = err?.message ?? '';
  if (status === 429) return true;
  return /daily ai limit|token budget|rate limited|too many requests|please wait a moment/i.test(message);
}

export function isRetryableAiError(err) {
  if (isQuotaOrRateLimitError(err)) return false;

  const status = err?.status;
  const message = err?.message ?? '';
  if (status === 502 || status === 503 || status === 504) return true;
  if (err?.name === 'AbortError') return true;
  return /502|503|504|bad gateway|timeout|timed out|aborted/i.test(message);
}

/**
 * Run an async fn with per-attempt timeout and exponential backoff.
 *
 * @template T
 * @param {() => Promise<T>} fn - Receives AbortSignal via fn's closure
 * @param {Object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxAttempts]
 * @param {number[]} [options.backoffMs]
 * @param {(err: unknown) => boolean} [options.isRetryable]
 * @param {(attempt: number, err: unknown) => void} [options.onAttemptFailed]
 * @returns {Promise<T>}
 */
export async function invokeWithRetry(fn, {
  timeoutMs = CHUNK_TIMEOUT_MS,
  maxAttempts = CHUNK_MAX_ATTEMPTS,
  backoffMs = CHUNK_BACKOFF_MS,
  isRetryable = isRetryableAiError,
  onAttemptFailed,
} = {}) {
  let lastError = null;
  let authRefreshed = false;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await fn(controller.signal);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      onAttemptFailed?.(attempt + 1, lastError);

      if (isAuthRefreshableError(lastError) && !authRefreshed) {
        authRefreshed = true;
        try {
          const { refreshAuth } = await import('@/api/requireAuth');
          await refreshAuth();
          continue;
        } catch {
          // Fall through to normal retry handling.
        }
      }

      const retryable = isRetryable(lastError);
      const hasMore = attempt < maxAttempts - 1;
      if (!retryable || !hasMore) break;

      const delay = backoffMs[attempt] ?? backoffMs[backoffMs.length - 1] ?? 2500;
      await sleep(delay);
    } finally {
      window.clearTimeout(timer);
    }
  }

  const failure = lastError ?? new Error('AI request failed.');
  if (failure.name === 'AbortError') {
    failure.message = `Request timed out after ${Math.round(timeoutMs / 1000)}s.`;
  }
  throw failure;
}

/**
 * Classify error for recovery UI.
 * @param {unknown} err
 * @returns {'timeout' | 'parse' | 'quota' | 'network' | 'unknown'}
 */
export function classifyAiFailure(err) {
  const status = err?.status;
  const message = err?.message ?? '';
  if (status === 429 || /daily ai limit|token budget/i.test(message)) return 'quota';
  if (status === 502 || status === 503 || status === 504 || err?.name === 'AbortError' || /timeout|timed out/i.test(message)) {
    return 'timeout';
  }
  if (/invalid format|validation|parse|JSON|schema/i.test(message)) return 'parse';
  if (status === 401 || /sign in/i.test(message)) return 'unknown';
  if (/502|503|504|network|fetch failed/i.test(message)) return 'network';
  return 'unknown';
}
