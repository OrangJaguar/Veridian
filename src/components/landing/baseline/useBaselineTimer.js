import { useEffect, useRef, useState, useCallback } from 'react';

const DURATION_SEC = 15;

export function useBaselineTimer(active, onExpire) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION_SEC);
  const [expired, setExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const progress = secondsLeft / DURATION_SEC;

  const reset = useCallback(() => {
    setSecondsLeft(DURATION_SEC);
    setExpired(false);
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    reset();
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const remaining = Math.max(0, DURATION_SEC - elapsed);
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        setExpired(true);
        onExpireRef.current?.();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [active, reset]);

  return { secondsLeft, progress, expired, duration: DURATION_SEC };
}
