import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Reads speech segments in order; exposes active segment key for highlighting.
 */
export function useGuideNarration(segments) {
  const [speaking, setSpeaking] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setActiveKey(null);
  }, []);

  const toggle = useCallback(() => {
    if (speaking) {
      stop();
      return;
    }
    if (!segments?.length) return;

    cancelledRef.current = false;
    setSpeaking(true);

    const speakAt = (index) => {
      if (cancelledRef.current || index >= segments.length) {
        setSpeaking(false);
        setActiveKey(null);
        return;
      }

      const seg = segments[index];
      setActiveKey(seg.key);

      const utter = new SpeechSynthesisUtterance(seg.text);
      utter.rate = 0.96;
      utter.onend = () => speakAt(index + 1);
      utter.onerror = () => speakAt(index + 1);
      window.speechSynthesis.speak(utter);
    };

    window.speechSynthesis?.cancel();
    speakAt(0);
  }, [segments, speaking, stop]);

  useEffect(() => () => stop(), [stop]);

  return { speaking, activeKey, toggle, stop };
}
