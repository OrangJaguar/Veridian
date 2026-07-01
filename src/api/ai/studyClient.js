import { base44 } from '@/api/base44Client';
import { requireAuth } from '@/api/requireAuth';
import { notifyAiQuotaChanged } from '@/api/ai/quota';
import { logAiGenerationError } from '@/api/errors/logAiGenerationError';
import {
  getActiveStudyAiTrace,
  isStudyAiDebugEnabled,
  isRawDumpEnabled,
  captureRawGemini,
  extractRawGeminiFromPayload,
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

function storeDebugAndRawFromPayload(payload, source) {
  if (!payload) return null;

  if (payload._debug) {
    window.__veridianLastServerAiDebug = payload._debug;
  }

  const raw = extractRawGeminiFromPayload(payload);
  if (raw && isStudyAiDebugEnabled()) {
    captureRawGemini(raw, { source, status: payload?.error?.status });
  }
  return raw;
}

function normalizeInvokeError(err) {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  const payload = extractErrorPayload(err);
  const serverMessage = extractServerMessage(err);
  const message = serverMessage ?? err?.message ?? String(err);

  storeDebugAndRawFromPayload(payload, 'error');

  const normalized = new Error(
    status === 400 && !serverMessage && message.includes('status code 400')
      ? 'AI could not generate valid study content. Try again in a moment.'
      : message,
  );
  normalized.status = status;
  normalized.serverPayload = payload;
  normalized.debug = payload?._debug ?? null;
  normalized.rawGeminiText = extractRawGeminiFromPayload(payload);
  normalized.rawError = err;

  if (status === 404 || message.includes('status code 404')) {
    normalized.message = FUNCTION_NOT_DEPLOYED_MSG;
  } else if (status === 503 || message.includes('GEMINI_API_KEY')) {
    normalized.message = KEY_NOT_CONFIGURED_MSG;
  } else if (status === 429) {
    if (/too many requests/i.test(message) && !message.includes('Daily AI')) {
      normalized.message = 'Too many requests. Wait a moment and try again.';
    } else {
      normalized.message = 'Daily AI limit reached. Try again tomorrow.';
      notifyAiQuotaChanged();
    }
  } else   if (status === 401) {
    normalized.message = 'Please sign in again to use AI features.';
  } else if (status === 504 || /504|timeout|timed out/i.test(message)) {
    normalized.message = 'AI generation timed out. The server has a ~60s limit per request — try again, or publish the latest geminiStudy build if this keeps happening.';
  }

  return normalized;
}

export async function invokeGeminiStudy(action, payload, options = {}) {
  const { signal } = options;
  const trace = getActiveStudyAiTrace();
  const debug = isStudyAiDebugEnabled();
  const rawDump = isRawDumpEnabled();

  const requestPayload = {
    ...payload,
    ...(debug ? { __debug: true } : {}),
    ...(rawDump ? { __rawDump: true } : {}),
  };

  const user = await requireAuth();
  if (!user?.email && !user?.id) {
    throw new Error('Please sign in to use AI features.');
  }

  if (debug && trace) {
    trace.stepStart('1a_invoke', 'POST geminiStudy', {
      action,
      rawDump,
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
    if (result?._meta) {
      window.__veridianLastGeminiStudyMeta = result._meta;
      if (typeof console !== 'undefined' && window.localStorage?.getItem('veridian:ai-debug') === '1') {
        console.info('[Veridian AI] geminiStudy _meta:', result._meta);
      }
    }

    storeDebugAndRawFromPayload(result, 'success');
    notifyAiQuotaChanged();
    if (debug && trace) {
      trace.stepOk('1a_invoke', 'POST geminiStudy', {
        resultKeys: Object.keys(result ?? {}),
        hasRaw: Boolean(extractRawGeminiFromPayload(result)),
        hasDebug: Boolean(result?._debug),
        meta: result?._meta,
      });
    }
    return result;
  };

  const handleFailure = (err) => {
    const normalized = normalizeInvokeError(err);
    const ticketRef = logAiGenerationError({
      action,
      message: normalized.message,
      error: normalized,
      route: typeof window !== 'undefined' ? window.location.pathname : '',
    });
    normalized.ticketRef = ticketRef;
    if (debug) {
      console.group('[Veridian AI] invoke failed — full server payload');
      console.log('status:', normalized.status);
      console.log('message:', normalized.message);
      console.log('serverPayload:', normalized.serverPayload);
      console.log('server _debug:', normalized.debug);
      console.log('rawGeminiText length:', normalized.rawGeminiText?.length ?? 0);
      if (normalized.rawGeminiText) console.log('rawGeminiText:', normalized.rawGeminiText);
      console.groupEnd();
    }
    if (trace && debug) {
      trace.stepFail('1a_invoke', 'POST geminiStudy', normalized, {
        status: normalized.status,
        serverPayload: normalized.serverPayload,
        serverDebug: normalized.debug,
        rawLength: normalized.rawGeminiText?.length ?? 0,
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

  storeDebugAndRawFromPayload(result, 'parse');

  // Debug responses attach rawGeminiText for inspection — only skip parsing for explicit raw-dump mode.
  const explicitRawDump = result.data?.parsedSkipped === true;
  if (explicitRawDump && (result.rawGeminiText || result.data?.rawGeminiText)) {
    return {
      rawGeminiText: result.rawGeminiText ?? result.data?.rawGeminiText,
      parsedSkipped: true,
      action: result.data?.action,
    };
  }

  if (result.error) {
    const err = new Error(result.error.message || result.error);
    err.status = result.error.status ?? result.status;
    err.debug = result._debug;
    err.rawGeminiText = result.rawGeminiText;
    throw normalizeInvokeError(err);
  }

  let data = result.data ?? result;
  if (data?.error) {
    const err = new Error(data.error.message || data.error);
    err.status = data.error.status ?? 500;
    err.data = data;
    throw normalizeInvokeError(err);
  }

  if (data?.data && typeof data.data === 'object' && !data.questions && !data.cards && !data.sections && !data.section) {
    data = data.data;
  }

  if (data && typeof data === 'object' && data.usage) {
    const { usage: _usage, ...rest } = data;
    data = rest;
  }

  return data;
}
