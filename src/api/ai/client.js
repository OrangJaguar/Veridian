import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { logClientError } from '@/api/errors/logClientError';
import { notifyAiQuotaChanged } from '@/api/ai/quota';

const FUNCTION_NOT_DEPLOYED_MSG =
  'The AI backend (geminiJourney) is not deployed yet. Push functions/geminiJourney/ to GitHub and Publish on Base44 (CLI deploy only works on Backend Platform apps). Also confirm GEMINI_API_KEY is set in Base44 secrets.';

const KEY_NOT_CONFIGURED_MSG =
  'GEMINI_API_KEY is not configured on the server. Run: base44 secrets set GEMINI_API_KEY=your_key';

function extractServerMessage(err) {
  const payload = err?.data ?? err?.response?.data ?? err?.body;
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      if (parsed?.error?.message) return parsed.error.message;
    } catch {
      // not JSON
    }
  }
  return null;
}

function normalizeInvokeError(err) {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  const serverMessage = extractServerMessage(err);
  const message = serverMessage ?? err?.message ?? String(err);

  if (status === 404 || message.includes('status code 404')) {
    return new Error(FUNCTION_NOT_DEPLOYED_MSG);
  }
  if (status === 503 || message.includes('GEMINI_API_KEY')) {
    return new Error(KEY_NOT_CONFIGURED_MSG);
  }
  if (status === 429) {
    notifyAiQuotaChanged();
    return new Error('Daily AI limit reached. Try again tomorrow.');
  }
  if (status === 401) {
    return new Error('Please sign in again to use AI features.');
  }
  if (status === 400 && message.includes('status code 400') && serverMessage) {
    return new Error(serverMessage);
  }
  if (status === 400 && message.includes('status code 400')) {
    return new Error('AI could not build a valid journey from your material. Try again or paste shorter text.');
  }

  if (status >= 500 || (!status && !serverMessage?.includes('Daily AI limit'))) {
    logClientError({
      message: `geminiJourney invoke failed: ${message}`,
      context: { status, source: 'ai-client', function: 'geminiJourney' },
    });
  }

  return err instanceof Error ? err : new Error(message);
}

/**
 * Invoke the geminiJourney Base44 backend function.
 * @param {'proposeJourney' | 'regenerateModules'} action
 * @param {object} payload
 * @param {{ signal?: AbortSignal }} options
 */
export async function invokeGemini(action, payload, options = {}) {
  const { signal } = options;

  const user = await requireAuth();
  if (!user?.email) {
    throw new Error('Please sign in to use AI features.');
  }

  let invokePromise;
  try {
    invokePromise = base44.functions.invoke('geminiJourney', {
      action,
      payload,
    });
  } catch (err) {
    throw normalizeInvokeError(err);
  }

  if (signal) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    try {
      return await Promise.race([invokePromise, abortPromise]);
    } catch (err) {
      throw normalizeInvokeError(err);
    }
  }

  try {
    const result = await invokePromise;
    notifyAiQuotaChanged();
    return result;
  } catch (err) {
    throw normalizeInvokeError(err);
  }
}

export function parseGeminiResponse(result) {
  if (!result) throw new Error('Empty response from AI service');

  if (result.error) {
    const err = new Error(result.error.message || result.error);
    err.status = result.error.status ?? result.status;
    throw normalizeInvokeError(err);
  }

  const data = result.data ?? result;
  if (data.error) {
    const err = new Error(data.error.message || data.error);
    err.status = data.status ?? 500;
    throw normalizeInvokeError(err);
  }

  return data;
}
