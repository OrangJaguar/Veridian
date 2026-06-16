import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

/**
 * Browser speech-to-text via Web Speech API + explicit mic permission prompt.
 * No server/API key required — Chrome and Edge work best.
 */
export function useSpeechRecognition({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const wantListeningRef = useRef(false);
  const baseTextRef = useRef('');
  const lastTranscriptRef = useRef('');

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const requestMicPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      const message = err?.name === 'NotAllowedError'
        ? 'Microphone access denied. Allow the mic in your browser bar and try again.'
        : 'Could not access the microphone.';
      toast.error(message);
      return false;
    }
  }, []);

  const start = useCallback(async (baseText = '') => {
    const SpeechRecognition = getRecognitionCtor();
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    const permitted = await requestMicPermission();
    if (!permitted) return;

    stop();
    wantListeningRef.current = true;
    baseTextRef.current = baseText;
    lastTranscriptRef.current = baseText.trim();

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onresult = (event) => {
      let sessionText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        sessionText += event.results[i][0].transcript;
      }
      const base = baseTextRef.current;
      const next = base.trim()
        ? `${base} ${sessionText}`.trim()
        : sessionText.trim();
      lastTranscriptRef.current = next;
      onTranscript?.(next);
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'no-speech') return;
      wantListeningRef.current = false;
      setListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied.');
      } else if (event.error === 'network') {
        toast.error('Voice input needs a network connection in this browser.');
      } else {
        toast.error(`Voice input stopped (${event.error}).`);
      }
    };

    recognition.onend = () => {
      if (!wantListeningRef.current) {
        setListening(false);
        return;
      }
      baseTextRef.current = lastTranscriptRef.current;
      try {
        recognition.start();
      } catch {
        wantListeningRef.current = false;
        setListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      toast.message('Listening… speak now', { duration: 2000 });
    } catch {
      wantListeningRef.current = false;
      toast.error('Could not start voice input.');
    }
  }, [onTranscript, requestMicPermission, stop]);

  const toggle = useCallback(async (baseText = '') => {
    if (listening) {
      stop();
      return;
    }
    await start(baseText);
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return {
    listening,
    toggle,
    start,
    stop,
    supported: isSpeechRecognitionSupported(),
  };
}
