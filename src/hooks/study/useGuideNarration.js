import { useState, useCallback, useEffect, useRef } from 'react';
import { resolveSpeechVoice } from '@/hooks/study/useSpeechVoices';

/**
 * Reads speech segments in order with pause/resume and jump-to-segment support.
 */
export function useGuideNarration(segments, { rate = 0.96, voiceURI = '' } = {}) {
  const [status, setStatus] = useState('idle');
  const [activeKey, setActiveKey] = useState(null);
  const cancelledRef = useRef(false);
  const currentIndexRef = useRef(0);
  const segmentsRef = useRef(segments);
  const prefsRef = useRef({ rate, voiceURI });

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    prefsRef.current = { rate, voiceURI };
  }, [rate, voiceURI]);

  // Apply voice/speed changes on the next segment without stopping narration.
  useEffect(() => {
    if (status !== 'speaking' && status !== 'paused') return;
    const idx = currentIndexRef.current;
    cancelledRef.current = false;
    window.speechSynthesis?.cancel();
    if (status === 'paused') {
      setStatus('speaking');
    }
    const list = segmentsRef.current;
    if (!list?.length || idx < 0 || idx >= list.length) return;

    const speakAt = (i) => {
      const segs = segmentsRef.current;
      if (cancelledRef.current || !segs?.length || i >= segs.length) {
        setStatus('idle');
        setActiveKey(null);
        return;
      }
      currentIndexRef.current = i;
      const seg = segs[i];
      setActiveKey(seg.key);
      const utter = new SpeechSynthesisUtterance(seg.text);
      const { rate: utterRate, voiceURI: utterVoiceURI } = prefsRef.current;
      utter.rate = utterRate;
      const voice = resolveSpeechVoice(utterVoiceURI, window.speechSynthesis.getVoices());
      if (voice) utter.voice = voice;
      utter.onend = () => { if (!cancelledRef.current) speakAt(i + 1); };
      utter.onerror = () => { if (!cancelledRef.current) speakAt(i + 1); };
      window.speechSynthesis.speak(utter);
    };
    speakAt(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart current segment when prefs change
  }, [rate, voiceURI]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setActiveKey(null);
  }, []);

  const speakFrom = useCallback((index) => {
    const list = segmentsRef.current;
    if (!list?.length || index < 0 || index >= list.length) return;

    cancelledRef.current = false;
    currentIndexRef.current = index;
    setStatus('speaking');
    window.speechSynthesis?.cancel();

    const speakAt = (i) => {
      const segs = segmentsRef.current;
      if (cancelledRef.current || !segs?.length || i >= segs.length) {
        setStatus('idle');
        setActiveKey(null);
        return;
      }

      currentIndexRef.current = i;
      const seg = segs[i];
      setActiveKey(seg.key);

      const utter = new SpeechSynthesisUtterance(seg.text);
      const { rate: utterRate, voiceURI: utterVoiceURI } = prefsRef.current;
      utter.rate = utterRate;
      const voice = resolveSpeechVoice(utterVoiceURI, window.speechSynthesis.getVoices());
      if (voice) utter.voice = voice;

      utter.onend = () => {
        if (cancelledRef.current) return;
        speakAt(i + 1);
      };
      utter.onerror = () => {
        if (!cancelledRef.current) speakAt(i + 1);
      };

      window.speechSynthesis.speak(utter);
    };

    speakAt(index);
  }, []);

  const pause = useCallback(() => {
    if (status !== 'speaking') return;
    window.speechSynthesis?.pause();
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;
    window.speechSynthesis?.resume();
    setStatus('speaking');
  }, [status]);

  const speakSegmentByKey = useCallback((key) => {
    const idx = segmentsRef.current?.findIndex((s) => s.key === key) ?? -1;
    if (idx >= 0) speakFrom(idx);
  }, [speakFrom]);

  const togglePlayPause = useCallback(() => {
    if (status === 'speaking') {
      pause();
    } else if (status === 'paused') {
      resume();
    } else {
      speakFrom(0);
    }
  }, [pause, resume, speakFrom, status]);

  useEffect(() => () => stop(), [stop]);

  return {
    status,
    speaking: status === 'speaking',
    paused: status === 'paused',
    activeKey,
    speakFrom,
    speakSegmentByKey,
    pause,
    resume,
    stop,
    togglePlayPause,
  };
}
