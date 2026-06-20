import { useRef } from 'react';
import { Mic, MicOff, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { useSpeechRecognition, isSpeechRecognitionSupported } from '@/hooks/useSpeechRecognition';
import MathSymbolsButton from '@/components/shared/MathSymbolsButton';
import { insertAtCursor } from '@/utils/latex/insertAtCursor';

export default function FeynmanChatInput({
  value,
  onChange,
  onSend,
  disabled,
  sending,
}) {
  const micSupported = isSpeechRecognitionSupported();
  const textareaRef = useRef(null);

  const { listening, requesting, toggle: toggleMic } = useSpeechRecognition({
    onTranscript: onChange,
  });

  const handleMicClick = () => {
    if (!micSupported) {
      toast.error('Voice input requires Chrome or Edge on desktop.');
      return;
    }
    toggleMic(value);
  };

  const handleMathInsert = (latex) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${latex}`);
      return;
    }
    const { text, selectionStart, selectionEnd } = insertAtCursor(
      value,
      latex,
      el.selectionStart,
      el.selectionEnd,
    );
    onChange(text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !sending) onSend();
    }
  };

  return (
    <div className="feynman-chat-input-bar">
      <button
        type="button"
        className={`feynman-mic-btn voice-mic-btn${listening ? ' active voice-mic-btn--active' : ''}`}
        onClick={handleMicClick}
        disabled={disabled || sending || requesting}
        aria-label={listening ? 'Stop microphone' : 'Voice input'}
        aria-pressed={listening}
      >
        {listening ? <MicOff size={18} strokeWidth={2} /> : <Mic size={18} strokeWidth={2} />}
      </button>
      <MathSymbolsButton onInsert={handleMathInsert} disabled={disabled || sending} />
      <textarea
        ref={textareaRef}
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
