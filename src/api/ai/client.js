import { base44 } from '@/api/base44Client';

/**
 * Invoke the geminiJourney Base44 backend function.
 * @param {'proposeJourney' | 'regenerateModules'} action
 * @param {object} payload
 * @param {{ signal?: AbortSignal, devBypassQuota?: boolean }} options
 */
export async function invokeGemini(action, payload, options = {}) {
  const { signal, devBypassQuota = false } = options;

  const invokePromise = base44.functions.invoke('geminiJourney', {
    action,
    payload,
    devBypassQuota: import.meta.env.DEV && devBypassQuota,
  });

  if (signal) {
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    return Promise.race([invokePromise, abortPromise]);
  }

  return invokePromise;
}

export function parseGeminiResponse(result) {
  if (!result) throw new Error('Empty response from AI service');

  if (result.error) {
    const err = new Error(result.error.message || result.error);
    err.status = result.error.status ?? result.status;
    throw err;
  }

  const data = result.data ?? result;
  if (data.error) {
    const err = new Error(data.error.message || data.error);
    err.status = data.status ?? 500;
    throw err;
  }

  return data;
}
