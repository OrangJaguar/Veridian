import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowUp } from 'lucide-react';

export default function FeynmanChatInput({
  value,
  onChange,
  onSend,
  disabled,
  sending,
}) {
  const micSupported = typeof window !== 'undefined'
    && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !sending) onSend();
    }
  };

  return (
    <div className="feynman-chat-input-bar">
      {micSupported && (
        <FeynmanMicButton
          value={value}
          onChange={onChange}
          disabled={disabled || sending}
        />
      )}
      <textarea
        className="feynman-chat-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Explain in your own words…"
        rows={1}
        disabled={disabled || sending}
      />
      <button
        type="button"
        className="feynman-send-btn"
        onClick={onSend}
        disabled={!value.trim() || disabled || sending}
        aria-label="Send message"
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function FeynmanMicButton({ value, onChange, disabled }) {
  const { listening, toggleMic } = useMicInput(value, onChange);

  return (
    <button
      type="button"
      className={`feynman-mic-btn${listening ? ' active' : ''}`}
      onClick={toggleMic}
      disabled={disabled}
      aria-label={listening ? 'Stop microphone' : 'Voice input'}
      aria-pressed={listening}
    >
      {listening ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
    </button>
  );
}

function useMicInput(value, onChange) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const valueRef = useRef(value);
  const micBaseRef = useRef('');

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    micBaseRef.current = valueRef.current;
    recognition.onresult = (event) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i][0].transcript;
      }
      const base = micBaseRef.current;
      const next = base.trim() ? `${base} ${chunk}` : chunk;
      onChange(next.trimStart());
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  return { listening, toggleMic };
}
