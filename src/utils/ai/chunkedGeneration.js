import { invokeWithRetry } from '@/utils/ai/invokeWithRetry';

/**
 * Run a sequential chunked generation loop with optional resume.
 *
 * @template TChunk, TResult
 * @param {Object} options
 * @param {number} options.totalChunks
 * @param {TResult[]} [options.existingResults]
 * @param {(index: number, priorResults: TResult[]) => Promise<TChunk>} options.runChunk
 * @param {(chunk: TChunk, index: number, allResults: TResult[]) => TResult} options.mapResult
 * @param {(result: TResult, index: number, total: number, allResults: TResult[]) => void} [options.onChunkComplete]
 * @param {string} [options.tracePrefix]
 * @param {import('@/utils/study/studyAiTrace').StudyAiTraceRun | null} [options.trace]
 * @returns {Promise<TResult[]>}
 */
export async function runChunkedGeneration({
  totalChunks,
  existingResults = [],
  startIndex: startIndexOverride,
  runChunk,
  mapResult,
  onChunkComplete,
  tracePrefix = 'chunk',
  trace = null,
}) {
  const results = [...existingResults];
  const startIndex = startIndexOverride ?? results.length;

  if (startIndex >= totalChunks) {
    return results.slice(0, totalChunks);
  }

  for (let i = startIndex; i < totalChunks; i += 1) {
    const stepId = `${tracePrefix}_${i}`;
    const chunkStart = Date.now();
    trace?.stepStart(stepId, `Chunk ${i + 1}/${totalChunks}`);

    try {
      const chunk = await invokeWithRetry(
        (signal) => runChunk(i, results, signal),
      );

      const mapped = mapResult(chunk, i, results);
      results.push(mapped);

      trace?.stepOk(stepId, `Chunk ${i + 1}/${totalChunks}`, {}, Date.now() - chunkStart);
      onChunkComplete?.(mapped, i, totalChunks, results);
    } catch (err) {
      trace?.stepFail(stepId, `Chunk ${i + 1}/${totalChunks}`, err, {
        partialCount: results.length,
      }, Date.now() - chunkStart);
      const wrapped = err instanceof Error ? err : new Error(String(err));
      wrapped.partialResults = results;
      wrapped.failedChunkIndex = i;
      throw wrapped;
    }
  }

  return results;
}
