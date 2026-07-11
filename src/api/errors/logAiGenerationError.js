import { logClientError } from '@/api/errors/logClientError';
import { fingerprintError } from '@/utils/errors/fingerprintError';

/**
 * Log AI generation failures with rich context for /admin/errors.
 * Returns a short reference code users can cite if they contact support.
 */
export function logAiGenerationError({
  action,
  message,
  error,
  route,
  chunkIndex,
  attempt,
  partialProgress,
} = {}) {
  const baseMessage = message || error?.message || 'AI generation failed';
  const stack = error?.stack ?? '';
  const ticketRef = fingerprintError(`ai:${action}:${baseMessage}`, stack).slice(0, 8).toUpperCase();

  const failureKind = error?.status === 429 ? 'quota'
    : /timeout|timed out|502|504|aborted/i.test(baseMessage) ? 'timeout'
      : /parse|JSON|validation|invalid format/i.test(baseMessage) ? 'parse'
        : 'unknown';

  const context = {
    ticketRef,
    action: action ?? 'unknown',
    status: error?.status ?? null,
    failureKind,
    chunkIndex: chunkIndex ?? error?.failedChunkIndex ?? null,
    attempt: attempt ?? null,
    partialProgress: partialProgress ?? error?.partialResults?.length ?? null,
    zodIssues: error?.serverPayload?._debug?.steps
      ?.find((s) => s.step === 'schema_validate')?.detail?.zodIssues
      ?? null,
    serverDebugSteps: error?.debug?.steps?.map((s) => ({
      step: s.step,
      ok: s.ok,
      error: s.error,
    })) ?? error?.serverPayload?._debug?.steps ?? null,
    rawPreview: error?.rawAiText
      ? String(error.rawAiText).slice(0, 1200)
      : null,
    aiTrace: error?.aiTrace ?? null,
  };

  logClientError({
    message: `AI generation failed [${action}]: ${baseMessage}`,
    stack,
    route,
    source: 'client',
    context,
  });

  return ticketRef;
}