/**
 * Run a guarded AI generation pipeline: invoke → normalize → validate → persist.
 */
import {
  createStudyAiTraceRun,
  withStudyAiTrace,
  isStudyAiDebugEnabled,
} from '@/utils/study/studyAiTrace';

export async function runStudyAiGeneration({
  action,
  label,
  generate,
  normalize,
  validate,
  persist,
}) {
  if (typeof generate !== 'function') {
    throw new Error('AI generation requires a generate function.');
  }
  if (typeof normalize !== 'function') {
    throw new Error('AI generation requires a normalize function.');
  }

  const trace = createStudyAiTraceRun({ action, label });

  return withStudyAiTrace(trace, async () => {
    const started = Date.now();
    try {
      trace.stepStart('1_generate', 'Call AI backend');
      let raw;
      try {
        raw = await generate();
        trace.stepOk('1_generate', 'Call AI backend', trace.summarizeCounts(raw), Date.now() - started);
      } catch (err) {
        trace.stepFail('1_generate', 'Call AI backend', err, {
          status: err?.status,
          serverPayload: err?.serverPayload,
          serverDebug: err?.debug ?? window.__veridianLastServerAiDebug,
        }, Date.now() - started);
        throw trace.enrichError(err);
      }

      const normalizeStart = Date.now();
      trace.stepStart('2_normalize', 'Normalize AI output');
      let normalized;
      try {
        normalized = normalize(raw);
        trace.stepOk('2_normalize', 'Normalize AI output', trace.summarizeCounts(normalized), Date.now() - normalizeStart);
      } catch (err) {
        trace.stepFail('2_normalize', 'Normalize AI output', err, {
          raw: trace.summarizeCounts(raw),
        }, Date.now() - normalizeStart);
        throw trace.enrichError(err);
      }

      if (validate) {
        const validateStart = Date.now();
        trace.stepStart('3_validate', 'Validate normalized output');
        try {
          validate(normalized);
          trace.stepOk('3_validate', 'Validate normalized output', trace.summarizeCounts(normalized), Date.now() - validateStart);
        } catch (err) {
          trace.stepFail('3_validate', 'Validate normalized output', err, {
            normalized: trace.summarizeCounts(normalized),
          }, Date.now() - validateStart);
          throw trace.enrichError(err);
        }
      }

      if (persist) {
        const persistStart = Date.now();
        trace.stepStart('4_persist', 'Save to database');
        try {
          await persist(normalized);
          trace.stepOk('4_persist', 'Save to database', { saved: true }, Date.now() - persistStart);
        } catch (err) {
          trace.stepFail('4_persist', 'Save to database', err, null, Date.now() - persistStart);
          throw trace.enrichError(err);
        }
      }

      trace.finishOk();
      return normalized;
    } catch (err) {
      trace.finishFail(err);
      throw err instanceof Error && err.aiTrace ? err : trace.enrichError(err);
    }
  });
}

export { isStudyAiDebugEnabled };
