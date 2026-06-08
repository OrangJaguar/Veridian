import { base44 } from '@/api/base44Client';

const FUNCTION_NOT_DEPLOYED_MSG =
  'The AI backend (geminiJourney) is not deployed yet. Publish the app on Base44 so base44/functions/geminiJourney.ts is live, and confirm GEMINI_API_KEY is set in Base44 secrets.';

const KEY_NOT_CONFIGURED_MSG =
  'GEMINI_API_KEY is not configured on the server. Run: base44 secrets set GEMINI_API_KEY=your_key';

function normalizeInvokeError(err) {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  const message = err?.message ?? String(err);

  if (status === 404 || message.includes('status code 404')) {
    return new Error(FUNCTION_NOT_DEPLOYED_MSG);
  }
  if (status === 503 || message.includes('GEMINI_API_KEY')) {
    return new Error(KEY_NOT_CONFIGURED_MSG);
  }
  if (status === 429) {
    return new Error('Daily AI limit reached. Try again tomorrow.');
  }
  if (status === 401) {
    return new Error('Please sign in again to use AI features.');
  }

  return err instanceof Error ? err : new Error(message);
}

/**
 * Invoke the geminiJourney Base44 backend function.
 * @param {'proposeJourney' | 'regenerateModules'} action
 * @param {object} payload
 * @param {{ signal?: AbortSignal, devBypassQuota?: boolean }} options
 */
export async function invokeGemini(action, payload, options = {}) {
  const { signal, devBypassQuota = false } = options;

  let invokePromise;
  try {
    invokePromise = base44.functions.invoke('geminiJourney', {
      action,
      payload,
      devBypassQuota: import.meta.env.DEV && devBypassQuota,
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
    return await invokePromise;
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
