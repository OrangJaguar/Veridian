import { useState, useCallback, useEffect, useRef } from 'react';
import { resolveSpeechVoice } from '@/hooks/study/useSpeechVoices';

/**
 * Reads speech segments in order with pause/resume and jump-to-segment support.
 */
export function useGuideNarration(segments, { rate = 0.96, voiceURI = '' } = {}) {
  const [status, setStatus] = useState('idle');
  const [activeKey, setActiveKey] = useState(null);
  const cancelledRef = useRef(false);
  const utteranceGenRef = useRef(0);
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

  const speakAt = useCallback((i, generation) => {
    const segs = segmentsRef.current;
    if (
      cancelledRef.current
      || generation !== utteranceGenRef.current
      || !segs?.length
      || i >= segs.length
    ) {
      if (generation === utteranceGenRef.current) {
        setStatus('idle');
        setActiveKey(null);
      }
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
      if (!cancelledRef.current && generation === utteranceGenRef.current) setStatus('speaking');
    };
    utter.onpause = () => {
      if (!cancelledRef.current && generation === utteranceGenRef.current) setStatus('paused');
    };
    utter.onresume = () => {
      if (!cancelledRef.current && generation === utteranceGenRef.current) setStatus('speaking');
    };
    utter.onend = () => {
      if (cancelledRef.current || generation !== utteranceGenRef.current) return;
      speakAtRef.current?.(i + 1, generation);
    };
    utter.onerror = () => {
      if (cancelledRef.current || generation !== utteranceGenRef.current) return;
      speakAtRef.current?.(i + 1, generation);
    };

    window.speechSynthesis.speak(utter);
  }, []);

  useEffect(() => {
    speakAtRef.current = speakAt;
  }, [speakAt]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    utteranceGenRef.current += 1;
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setActiveKey(null);
  }, []);

  const speakFrom = useCallback((index) => {
    const list = segmentsRef.current;
    if (!list?.length || index < 0 || index >= list.length) return;

    cancelledRef.current = true;
    window.speechSynthesis?.cancel();
    const generation = utteranceGenRef.current + 1;
    utteranceGenRef.current = generation;

    window.setTimeout(() => {
      if (generation !== utteranceGenRef.current) return;
      cancelledRef.current = false;
      speakAt(index, generation);
    }, 50);
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
