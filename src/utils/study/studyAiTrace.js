const STORAGE_KEY = 'veridian:ai-debug';
const RAW_DUMP_KEY = 'veridian:ai-raw-dump';
const MAX_RUNS = 10;

/** @type {StudyAiTraceRun | null} */
let activeTrace = null;

/** @type {StudyAiTraceRun[]} */
const runHistory = [];

function preview(value, max = 400) {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text) return '(empty)';
    return text.length > max ? `${text.slice(0, max)}… [${text.length} chars]` : text;
  } catch {
    return String(value);
  }
}

function countField(data, field) {
  const value = data?.[field];
  return Array.isArray(value) ? value.length : null;
}

export function isStudyAiDebugEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === '1') return true;
  } catch {
    // ignore
  }
  try {
    return new URLSearchParams(window.location.search).get('aiDebug') === '1';
  } catch {
    return false;
  }
}

export function isRawDumpEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(RAW_DUMP_KEY) === '1';
  } catch {
    return false;
  }
}

export function enableRawDumpMode() {
  enableStudyAiDebug();
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RAW_DUMP_KEY, '1');
  console.info(
    '%c[Veridian AI] RAW DUMP MODE ON',
    'color:#fbbf24;font-weight:bold;font-size:13px',
    '— AI response will be returned with NO parsing. Reload the page, then trigger the AI action.',
  );
}

export function disableRawDumpMode() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RAW_DUMP_KEY);
  console.info('%c[Veridian AI] Raw dump mode OFF', 'color:#94a3b8;font-weight:bold');
}

export function captureRawAi(text, meta = {}) {
  if (!text) return null;
  window.__veridianLastRawAi = text;
  window.__veridianLastRawAiMeta = meta;

  console.group(
    '%c[Veridian AI] FULL RAW AI RESPONSE (unparsed)',
    'color:#fbbf24;font-weight:bold;font-size:14px',
  );
  console.log(text);
  console.log('Character length:', text.length);
  console.log('Meta:', meta);
  console.groupEnd();

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.info('%c[Veridian AI] Raw response copied to clipboard.', 'color:#86efac');
    }).catch(() => {});
  }

  return text;
}

export function getLastRawAi() {
  return window.__veridianLastRawAi ?? null;
}

export function extractRawAiFromPayload(payload) {
  if (!payload) return null;
  return payload.rawAiText
    ?? payload.data?.rawAiText
    ?? payload._debug?.lastRawAiText
    ?? null;
}

export function enableStudyAiDebug() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, '1');
  console.info(
    '%c[Veridian AI Debug] ON',
    'color:#7dd3fc;font-weight:bold',
    '— For full unparsed AI text run veridianAiDebug.rawOn() then reload',
  );
}

export function disableStudyAiDebug() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  console.info('%c[Veridian AI Debug] OFF', 'color:#94a3b8;font-weight:bold');
}

export function initStudyAiDebugFromUrl() {
  if (typeof window === 'undefined') return;
  if (new URLSearchParams(window.location.search).get('aiDebug') === '1') {
    enableStudyAiDebug();
  }
  if (new URLSearchParams(window.location.search).get('aiRaw') === '1') {
    enableRawDumpMode();
  }

  window.veridianAiDebug = {
    on: enableStudyAiDebug,
    off: () => {
      disableStudyAiDebug();
      disableRawDumpMode();
    },
    rawOn: enableRawDumpMode,
    rawOff: disableRawDumpMode,
    isOn: isStudyAiDebugEnabled,
    isRawOn: isRawDumpEnabled,
    lastRun: () => runHistory[runHistory.length - 1] ?? null,
    lastServer: () => window.__veridianLastServerAiDebug ?? null,
    lastRaw: getLastRawAi,
    printRaw: () => {
      const raw = getLastRawAi();
      if (!raw) {
        console.warn('[Veridian AI] No raw AI text captured yet.');
        return null;
      }
      console.log(raw);
      return raw;
    },
    history: () => [...runHistory],
    printLast: () => {
      const run = runHistory[runHistory.length - 1];
      if (!run) {
        console.warn('[Veridian AI Debug] No runs recorded yet.');
        return null;
      }
      run.print();
      return run;
    },
  };

  if (isStudyAiDebugEnabled()) {
    console.info(
      '%c[Veridian AI Debug] active',
      'color:#7dd3fc;font-weight:bold',
      '— use veridianAiDebug.printLast() after a failed generation',
    );
  }
}

export function getActiveStudyAiTrace() {
  return activeTrace;
}

export function withStudyAiTrace(trace, fn) {
  const prev = activeTrace;
  activeTrace = trace;
  return Promise.resolve(fn()).finally(() => {
    activeTrace = prev;
  });
}

/**
 * @param {{ action?: string; label?: string }} opts
 */
export function createStudyAiTraceRun(opts = {}) {
  const action = opts.action ?? opts.label ?? 'unknown';
  const startedAt = Date.now();
  /** @type {Array<{ id: string; label: string; ok: boolean; ms: number; detail?: unknown; error?: string }>} */
  const steps = [];

  const run = {
    id: `${action}-${startedAt}`,
    action,
    startedAt,
    finishedAt: null,
    status: 'running',
    failedStep: null,
    steps,
    error: null,

    stepStart(id, label, detail) {
      if (!isStudyAiDebugEnabled()) return;
      console.groupCollapsed(
        `%c[Veridian AI] ${action} → ${label}`,
        'color:#7dd3fc;font-weight:bold',
      );
      if (detail != null) console.log('detail:', detail);
    },

    stepOk(id, label, detail, ms = 0) {
      steps.push({ id, label, ok: true, ms, detail });
      if (!isStudyAiDebugEnabled()) return;
      console.log(`%c✓ ${label}`, 'color:#86efac;font-weight:bold', ms ? `(${ms}ms)` : '', detail ?? '');
      console.groupEnd();
    },

    stepFail(id, label, error, detail, ms = 0) {
      const message = error instanceof Error ? error.message : String(error);
      steps.push({ id, label, ok: false, ms, detail, error: message });
      run.status = 'failed';
      run.failedStep = id;
      run.error = message;
      if (!isStudyAiDebugEnabled()) return;
      console.error(`%c✗ ${label}`, 'color:#fca5a5;font-weight:bold', message, detail ?? '');
      console.groupEnd();
    },

    finishOk() {
      run.status = 'ok';
      run.finishedAt = Date.now();
      runHistory.push(run);
      while (runHistory.length > MAX_RUNS) runHistory.shift();
      window.__veridianLastAiTrace = run;
      if (!isStudyAiDebugEnabled()) return;
      console.info(
        `%c[Veridian AI] ${action} — all steps passed (${run.finishedAt - startedAt}ms)`,
        'color:#86efac;font-weight:bold',
        steps,
      );
    },

    finishFail(error) {
      run.status = 'failed';
      run.finishedAt = Date.now();
      run.error = error instanceof Error ? error.message : String(error);
      runHistory.push(run);
      while (runHistory.length > MAX_RUNS) runHistory.shift();
      window.__veridianLastAiTrace = run;
      if (!isStudyAiDebugEnabled()) return;
      console.group(
        `%c[Veridian AI] ${action} — FAILED at ${run.failedStep ?? 'unknown'}`,
        'color:#fca5a5;font-weight:bold',
      );
      console.table(steps.map((s) => ({
        step: s.label,
        ok: s.ok ? '✓' : '✗',
        ms: s.ms,
        error: s.error ?? '',
      })));
      console.log('Steps (full detail):', steps);
      if (window.__veridianLastServerAiDebug) {
        console.log('Server _debug:', window.__veridianLastServerAiDebug);
      }
      const rawFail = getLastRawAi();
      if (rawFail) console.log('Raw AI (length %d):', rawFail.length, rawFail);
      console.groupEnd();
    },

    print() {
      console.group(`[Veridian AI Trace] ${action} (${run.status})`);
      console.table(steps.map((s) => ({
        step: s.label,
        ok: s.ok,
        ms: s.ms,
        error: s.error ?? '',
      })));
      steps.forEach((s) => {
        if (s.detail) console.log(`${s.label} detail:`, s.detail);
      });
      if (window.__veridianLastServerAiDebug) {
        console.log('Server _debug:', window.__veridianLastServerAiDebug);
      }
      const rawPrint = getLastRawAi();
      if (rawPrint) console.log('Raw AI (length %d):', rawPrint.length, rawPrint);
      console.groupEnd();
    },

    enrichError(error) {
      const base = error instanceof Error ? error : new Error(String(error));
      base.aiTrace = {
        action,
        failedStep: run.failedStep,
        steps: steps.map((s) => ({ step: s.label, ok: s.ok, error: s.error, detail: s.detail })),
        serverDebug: window.__veridianLastServerAiDebug ?? null,
      };
      return base;
    },

    summarizeCounts(data) {
      if (!data || typeof data !== 'object') return {};
      return {
        questions: countField(data, 'questions'),
        sections: countField(data, 'sections'),
        cards: countField(data, 'cards'),
        keys: Object.keys(data),
        preview: preview(data, 300),
      };
    },
  };

  if (isStudyAiDebugEnabled()) {
    console.info(
      `%c[Veridian AI] trace started: ${action}`,
      'color:#7dd3fc;font-weight:bold',
    );
  }

  return run;
}

export function formatStudyAiDebugSummary(error) {
  const trace = error?.aiTrace ?? window.__veridianLastAiTrace;
  if (!isStudyAiDebugEnabled() || !trace) return null;

  const steps = trace.steps ?? error?.aiTrace?.steps ?? [];
  const failed = trace.failedStep ?? steps.find((s) => !s.ok)?.id;
  const server = error?.aiTrace?.serverDebug ?? window.__veridianLastServerAiDebug;

  const lines = [
    `Failed at: ${failed ?? 'unknown'}`,
    ...steps.filter((s) => !s.ok).map((s) => `${s.label}: ${s.error ?? 'failed'}`),
  ];

  if (server?.steps?.length) {
    const serverFail = server.steps.find((s) => !s.ok);
    if (serverFail) {
      lines.push(`Server: ${serverFail.step} — ${serverFail.error ?? JSON.stringify(serverFail.detail)}`);
    }
  }

  return lines.join('\n');
}