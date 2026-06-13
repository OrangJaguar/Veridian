import { base44 } from '@/api/base44Client';

const FUNCTION_NOT_DEPLOYED_MSG =
  'The AI backend (geminiStudy) is not deployed yet. Push functions/geminiStudy/ to GitHub and Publish on Base44.';

const KEY_NOT_CONFIGURED_MSG =
  'GEMINI_API_KEY is not configured on the server.';

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

export async function invokeGeminiStudy(action, payload, options = {}) {
  const { signal, devBypassQuota = false } = options;

  const user = await base44.auth.me();
  if (!user?.email) {
    throw new Error('Please sign in to use AI features.');
  }

  let invokePromise;
  try {
    invokePromise = base44.functions.invoke('geminiStudy', {
      action,
      payload,
      devBypassQuota: import.meta.env.DEV && devBypassQuota,
    });
  } catch (err) {
    throw normalizeInvokeError(err);
  }

  if (signal) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    return Promise.race([invokePromise, abortPromise]).catch(normalizeInvokeError);
  }

  return invokePromise.catch(normalizeInvokeError);
}

export function parseGeminiStudyResponse(result) {
  if (!result) throw new Error('Empty response from AI service');
  const data = result.data ?? result;
  if (data?.error) {
    const err = new Error(data.error.message || data.error);
    err.status = data.error.status ?? 500;
    throw normalizeInvokeError(err);
  }
  return data;
}
