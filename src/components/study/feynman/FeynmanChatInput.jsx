import { Mic, MicOff, ArrowUp } from 'lucide-react';
import { useSpeechRecognition, isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';

export default function FeynmanChatInput({
  value,
  onChange,
  onSend,
  disabled,
  sending,
}) {
  const micSupported = isSpeechRecognitionSupported();

  const { listening, toggle: toggleMic } = useSpeechRecognition({
    onTranscript: onChange,
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !sending) onSend();
    }
  };

  return (
    <div className="feynman-chat-input-bar">
      {micSupported && (
        <button
          type="button"
          className={`feynman-mic-btn voice-mic-btn${listening ? ' active voice-mic-btn--active' : ''}`}
          onClick={() => toggleMic(value)}
          disabled={disabled || sending}
          aria-label={listening ? 'Stop microphone' : 'Voice input'}
          aria-pressed={listening}
        >
          {listening ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
        </button>
      )}
      <textarea
        className="feynman-chat-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={micSupported ? 'Explain in your own words — or tap the mic…' : 'Explain in your own words…'}
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
