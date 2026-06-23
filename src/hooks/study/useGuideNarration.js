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
  const speakAtRef = useRef(null);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    prefsRef.current = { rate, voiceURI };
  }, [rate, voiceURI]);

  const speakAt = useCallback((i) => {
    const segs = segmentsRef.current;
    if (cancelledRef.current || !segs?.length || i >= segs.length) {
      setStatus('idle');
      setActiveKey(null);
      return;
    }

    currentIndexRef.current = i;
    const seg = segs[i];
    setActiveKey(seg.key);
    setStatus('speaking');

    const utter = new SpeechSynthesisUtterance(seg.text);
    const { rate: utterRate, voiceURI: utterVoiceURI } = prefsRef.current;
    utter.rate = utterRate;
    const voice = resolveSpeechVoice(utterVoiceURI, window.speechSynthesis.getVoices());
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      if (!cancelledRef.current) setStatus('speaking');
    };
    utter.onpause = () => {
      if (!cancelledRef.current) setStatus('paused');
    };
    utter.onresume = () => {
      if (!cancelledRef.current) setStatus('speaking');
    };
    utter.onend = () => {
      if (!cancelledRef.current) speakAtRef.current?.(i + 1);
    };
    utter.onerror = () => {
      if (!cancelledRef.current) speakAtRef.current?.(i + 1);
    };

    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => {
    speakAtRef.current = speakAt;
  }, [speakAt]);

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
    window.speechSynthesis?.cancel();

    // Let the browser finish cancel before starting the next utterance (Safari/Chrome).
    window.setTimeout(() => {
      if (cancelledRef.current) return;
      speakAt(index);
    }, 0);
  }, [speakAt]);

  const pause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth?.speaking || synth.paused) return;
    synth.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth?.paused) return;
    synth.resume();
    setStatus('speaking');
  }, []);

  const speakSegmentByKey = useCallback((key) => {
    const idx = segmentsRef.current?.findIndex((s) => s.key === key) ?? -1;
    if (idx >= 0) speakFrom(idx);
  }, [speakFrom]);

  const togglePlayPause = useCallback(() => {
    const synth = window.speechSynthesis;
    if (synth?.speaking && !synth.paused) {
      pause();
      return;
    }
    if (synth?.paused) {
      resume();
      return;
    }
    speakFrom(0);
  }, [pause, resume, speakFrom]);

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
