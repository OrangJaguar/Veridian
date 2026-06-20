import { useState, useEffect } from 'react';

export function useSpeechVoices() {
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;

    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };

    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  return voices;
}

export function resolveSpeechVoice(voiceURI, voices) {
  if (!voiceURI || !voices?.length) return null;
  return voices.find((v) => v.voiceURI === voiceURI) ?? null;
}
