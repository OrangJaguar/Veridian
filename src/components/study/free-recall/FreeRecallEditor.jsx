import { useState, useEffect, useRef } from 'react';
import { Pause, Mic, MicOff, Lightbulb } from 'lucide-react';
import StudyBackButton from '@/components/study/shared/StudyBackButton';
import FreeRecallHintModal from '@/components/study/free-recall/FreeRecallHintModal';
import { formatStudyTime } from '@/utils/study/feedback';

export default function FreeRecallEditor({
  moduleName,
  response,
  onResponseChange,
  hints,
  hintLoading,
  hintModalOpen,
  onHintModalOpen,
  onHintModalClose,
  onGenerateHint,
  onSubmit,
  submitting,
  onExit,
}) {
  const [paused, setPaused] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [listening, setListening] = useState(false);
  const [wasVoice, setWasVoice] = useState(false);
  const recognitionRef = useRef(null);
  const responseRef = useRef(response);
  const micBaseRef = useRef('');

  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setElapsedSec((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);

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
    micBaseRef.current = responseRef.current;
    recognition.onresult = (event) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i][0].transcript;
      }
      const base = micBaseRef.current;
      const next = base.trim() ? `${base} ${chunk}` : chunk;
      onResponseChange(next.trimStart());
      setWasVoice(true);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const micSupported = typeof window !== 'undefined'
    && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const handleSubmit = () => {
    onSubmit({ elapsedSec, wasVoice });
  };

  return (
    <div className="study-mode-view free-recall-mode-view">
      <header className="free-recall-header">
        <StudyBackButton onClick={onExit} label="Exit recall" />
        <h1 className="free-recall-title">
          Write everything you remember about <span>{moduleName}</span>
        </h1>
      </header>

      <div className="free-recall-toolbar">
        <div className="free-recall-toolbar-left">
          <button
            type="button"
            className="free-recall-tool-btn"
            onClick={onHintModalOpen}
            aria-label="Hints"
          >
            <Lightbulb size={16} strokeWidth={2} />
            Hint
            {hints.length > 0 && <span className="free-recall-hint-badge">{hints.length}/3</span>}
          </button>
          {micSupported && (
            <button
              type="button"
              className={`free-recall-tool-btn${listening ? ' active' : ''}`}
              onClick={toggleMic}
              aria-label={listening ? 'Stop microphone' : 'Voice input'}
              aria-pressed={listening}
            >
              {listening ? <MicOff size={16} strokeWidth={2} /> : <Mic size={16} strokeWidth={2} />}
              {listening ? 'Stop' : 'Mic'}
            </button>
          )}
        </div>

        <div className="timer-suite">
          {!timerHidden && (
            <span className="time-display">{formatStudyTime(elapsedSec)}</span>
          )}
          <button
            type="button"
            className="util-btn"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume timer' : 'Pause timer'}
          >
            <Pause size={12} fill="currentColor" />
          </button>
          <button
            type="button"
            className="util-btn"
            onClick={() => setTimerHidden((h) => !h)}
          >
            {timerHidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {paused ? (
        <div className="paused-mask free-recall-paused-mask">
          <h2 className="paused-title">Timer Paused</h2>
          <p className="paused-desc">Your recall is hidden while paused.</p>
          <button type="button" className="btn btn-primary paused-resume" onClick={() => setPaused(false)}>
            Resume
          </button>
        </div>
      ) : (
        <>
          <div className="free-recall-editor-wrap">
            <textarea
              className="free-recall-textarea"
              value={response}
              onChange={(e) => onResponseChange(e.target.value)}
              placeholder="Start typing everything you remember…"
              spellCheck
            />
            <span className="free-recall-char-count">{response.length.toLocaleString()} characters</span>
          </div>

          <div className="free-recall-submit-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!response.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Grading…' : 'Submit recall'}
            </button>
          </div>
        </>
      )}

      <FreeRecallHintModal
        open={hintModalOpen}
        hints={hints}
        loading={hintLoading}
        onClose={onHintModalClose}
        onGenerateNext={onGenerateHint}
      />
    </div>
  );
}