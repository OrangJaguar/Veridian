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
} = {}) {
  const baseMessage = message || error?.message || 'AI generation failed';
  const stack = error?.stack ?? '';
  const ticketRef = fingerprintError(`ai:${action}:${baseMessage}`, stack).slice(0, 8).toUpperCase();

  const context = {
    ticketRef,
    action: action ?? 'unknown',
    status: error?.status ?? null,
    zodIssues: error?.serverPayload?._debug?.steps
      ?.find((s) => s.step === 'schema_validate')?.detail?.zodIssues
      ?? null,
    serverDebugSteps: error?.debug?.steps?.map((s) => ({
      step: s.step,
      ok: s.ok,
      error: s.error,
    })) ?? error?.serverPayload?._debug?.steps ?? null,
    rawPreview: error?.rawGeminiText
      ? String(error.rawGeminiText).slice(0, 1200)
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
