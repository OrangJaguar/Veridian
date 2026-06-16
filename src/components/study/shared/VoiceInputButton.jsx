import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function VoiceInputButton({ onTranscript, disabled, baseText = '' }) {
  const { listening, toggle, supported } = useSpeechRecognition({ onTranscript });

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`voice-input-btn${listening ? ' voice-input-btn--active' : ''}`}
      disabled={disabled}
      onClick={() => toggle(baseText)}
      aria-label={listening ? 'Stop microphone' : 'Start voice input'}
      aria-pressed={listening}
    >
      {listening ? 'Stop mic' : 'Voice input'}
    </button>
  );
}
