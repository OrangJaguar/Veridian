import { base44 } from '@/api/base44Client';

let activeController = null;

export function abortToolsAssistant() {
  activeController?.abort();
  activeController = null;
}

function extractError(err) {
  const msg = err?.data?.error?.message || err?.message;
  return msg || 'Assistant unavailable';
}

/**
 * @param {{ text: string, context: object, signal?: AbortSignal }} params
 */
export async function invokeToolsAssistant({ text, context, signal }) {
  const controller = new AbortController();
  activeController = controller;

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await base44.functions.invoke('toolsAssistant', {
      text: text?.trim()?.slice(0, 500) || '',
      context,
    });
    if (res?.error) throw new Error(res.error.message || 'Assistant failed');
    return res;
  } catch (err) {
    throw new Error(extractError(err));
  } finally {
    if (activeController === controller) activeController = null;
  }
}
