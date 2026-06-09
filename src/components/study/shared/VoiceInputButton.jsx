import { useState, useEffect, useRef } from 'react';

export default function VoiceInputButton({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      onTranscript(text);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) return null;

  return (
    <button
      type="button"
      className={`btn btn-secondary btn-sm${listening ? ' active' : ''}`}
      disabled={disabled}
      onClick={listening ? stop : start}
    >
      {listening ? 'Stop mic' : 'Voice input'}
    </button>
  );
}
