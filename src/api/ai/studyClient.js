import { base44 } from '@/api/base44Client';
import {
  getActiveStudyAiTrace,
  isStudyAiDebugEnabled,
} from '@/utils/study/studyAiTrace';

const FUNCTION_NOT_DEPLOYED_MSG =
  'The AI backend (geminiStudy) is not deployed yet. Push functions/geminiStudy/ to GitHub and Publish on Base44.';

const KEY_NOT_CONFIGURED_MSG =
  'GEMINI_API_KEY is not configured on the server.';

function extractErrorPayload(err) {
  return err?.data ?? err?.response?.data ?? err?.body ?? err?.response?.body ?? null;
}

function extractServerMessage(err) {
  const payload = extractErrorPayload(err);
  if (payload?.error?.message) return payload.error.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.message === 'string') return payload.message;
  if (typeof payload?.detail === 'string') return payload.detail;
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
  const payload = extractErrorPayload(err);
  const serverMessage = extractServerMessage(err);
  const message = serverMessage ?? err?.message ?? String(err);

  const normalized = new Error(
    status === 400 && !serverMessage && message.includes('status code 400')
      ? 'AI could not generate valid study content. Try again in a moment.'
      : message,
  );
  normalized.status = status;
  normalized.serverPayload = payload;
  normalized.debug = payload?._debug ?? null;
  normalized.rawError = err;

  if (status === 404 || message.includes('status code 404')) {
    normalized.message = FUNCTION_NOT_DEPLOYED_MSG;
  } else if (status === 503 || message.includes('GEMINI_API_KEY')) {
    normalized.message = KEY_NOT_CONFIGURED_MSG;
  } else if (status === 429) {
    normalized.message = 'Daily AI limit reached. Try again tomorrow.';
  } else if (status === 401) {
    normalized.message = 'Please sign in again to use AI features.';
  }

  if (normalized.debug) {
    window.__veridianLastServerAiDebug = normalized.debug;
  }

  return normalized;
}

export async function invokeGeminiStudy(action, payload, options = {}) {
  const { signal } = options;
  const trace = getActiveStudyAiTrace();
  const debug = isStudyAiDebugEnabled();
  const requestPayload = debug ? { ...payload, __debug: true } : payload;

  const user = await base44.auth.me();
  if (!user?.email && !user?.id) {
    throw new Error('Please sign in to use AI features.');
  }

  if (debug && trace) {
    trace.stepStart('1a_invoke', 'POST geminiStudy', {
      action,
      payloadKeys: Object.keys(payload ?? {}),
    });
  }

  let invokePromise;
  try {
    invokePromise = base44.functions.invoke('geminiStudy', {
      action,
      payload: requestPayload,
    });
  } catch (err) {
    const normalized = normalizeInvokeError(err);
    if (debug) {
      console.error('[Veridian AI] invoke threw synchronously:', normalized.serverPayload ?? err);
    }
    throw normalized;
  }

  const handleResult = (result) => {
    if (result?._debug) {
      window.__veridianLastServerAiDebug = result._debug;
      if (debug) console.log('[Veridian AI] server _debug (success):', result._debug);
    }
    return result;
  };

  const handleFailure = (err) => {
    const normalized = normalizeInvokeError(err);
    if (debug) {
      console.group('[Veridian AI] invoke failed — raw error');
      console.log('status:', normalized.status);
      console.log('message:', normalized.message);
      console.log('serverPayload:', normalized.serverPayload);
      console.log('server _debug:', normalized.debug);
      console.log('rawError:', normalized.rawError);
      console.groupEnd();
    }
    if (trace && debug) {
      trace.stepFail('1a_invoke', 'POST geminiStudy', normalized, {
        status: normalized.status,
        serverPayload: normalized.serverPayload,
        serverDebug: normalized.debug,
      });
    }
    throw normalized;
  };

  if (signal) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
    return Promise.race([invokePromise, abortPromise])
      .then(handleResult)
      .catch(handleFailure);
  }

  return invokePromise.then(handleResult).catch(handleFailure);
}

export function parseGeminiStudyResponse(result) {
  if (!result) throw new Error('Empty response from AI service');

  if (result.error) {
    if (result._debug) window.__veridianLastServerAiDebug = result._debug;
    const err = new Error(result.error.message || result.error);
    err.status = result.error.status ?? result.status;
    err.debug = result._debug;
    throw normalizeInvokeError(err);
  }

  let data = result.data ?? result;
  if (data?.error) {
    if (data._debug || result._debug) {
      window.__veridianLastServerAiDebug = data._debug ?? result._debug;
    }
    const err = new Error(data.error.message || data.error);
    err.status = data.error.status ?? 500;
    err.data = data;
    throw normalizeInvokeError(err);
  }

  if (result._debug) {
    window.__veridianLastServerAiDebug = result._debug;
  }

  if (data?.data && typeof data.data === 'object' && !data.questions && !data.cards && !data.sections) {
    data = data.data;
  }

  if (data && typeof data === 'object' && data.usage) {
    const { usage: _usage, ...rest } = data;
    data = rest;
  }

  return data;
}
