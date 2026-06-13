import { useState, useEffect, useRef, useCallback } from 'react';
import { runStudyAiGeneration } from '@/hooks/ai/runStudyAiGeneration';

/**
 * Auto-run AI generation once when enabled and content is missing.
 * Supports retry without effect re-entry loops.
 */
export function useStudyAiAutoGeneration({
  enabled = true,
  hasContent = false,
  generate,
  normalize,
  validate,
  persist,
  onSuccess,
  onError,
  beforeGenerate,
}) {
  const [status, setStatus] = useState(hasContent ? 'ready' : 'idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const startedRef = useRef(hasContent);
  const runIdRef = useRef(0);
  const pipelineRef = useRef({
    generate, normalize, validate, persist, onSuccess, onError, beforeGenerate,
  });

  pipelineRef.current = {
    generate, normalize, validate, persist, onSuccess, onError, beforeGenerate,
  };

  const execute = useCallback(async () => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(null);

    try {
      const pipeline = pipelineRef.current;
      if (pipeline.beforeGenerate) {
        await pipeline.beforeGenerate();
      }

      const result = await runStudyAiGeneration({
        generate: pipeline.generate,
        normalize: pipeline.normalize,
        validate: pipeline.validate,
        persist: pipeline.persist,
      });

      if (runId !== runIdRef.current) return result;

      setData(result);
      setStatus('ready');
      pipeline.onSuccess?.(result);
      return result;
    } catch (err) {
      if (runId !== runIdRef.current) return null;

      const message = err instanceof Error ? err : new Error(String(err));
      setError(message);
      setStatus('error');
      pipelineRef.current.onError?.(message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled || hasContent || startedRef.current) return undefined;
    startedRef.current = true;
    execute();
    return undefined;
  }, [enabled, hasContent, execute]);

  const retry = useCallback(() => {
    startedRef.current = true;
    return execute();
  }, [execute]);

  return {
    status,
    error,
    data,
    retry,
    isLoading: status === 'loading',
    isError: status === 'error',
    isReady: status === 'ready',
  };
}

/**
 * Manual AI generation for user-triggered flows (quiz setup, etc.).
 */
export function useStudyAiManualGeneration() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const runIdRef = useRef(0);

  const run = useCallback(async (pipeline) => {
    const runId = ++runIdRef.current;
    setStatus('loading');
    setError(null);

    try {
      const result = await runStudyAiGeneration(pipeline);
      if (runId !== runIdRef.current) return result;
      setStatus('ready');
      return result;
    } catch (err) {
      if (runId !== runIdRef.current) return null;
      const message = err instanceof Error ? err : new Error(String(err));
      setError(message);
      setStatus('error');
      throw message;
    } finally {
      if (runId === runIdRef.current) {
        setStatus((current) => (current === 'loading' ? 'idle' : current));
      }
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { run, reset, status, error, isLoading: status === 'loading' };
}
