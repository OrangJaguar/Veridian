import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { getRandomTypingSample, formatWPM, formatAccuracy } from '../../lib/utils-text';
import { formatDate } from '../../lib/utils-date';

export default function TypingMain() {
  const { typingResults, addTypingResult } = useAxiomStore();
  const [sample, setSample] = useState(getRandomTypingSample);
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const reset = useCallback(() => {
    setSample(getRandomTypingSample());
    setInput(''); setStarted(false); setFinished(false); setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 250);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished, startTime]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (!started && val.length === 1) { setStarted(true); setStartTime(Date.now()); }
    setInput(val);
    if (val === sample) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
      const seconds = (Date.now() - startTime) / 1000;
      const words = sample.split(' ').length;
      const wpm = Math.round((words / seconds) * 60);
      const errors = val.split('').filter((c, i) => c !== sample[i]).length;
      const accuracy = Math.round(((sample.length - errors) / sample.length) * 100);
      addTypingResult({ date: new Date().toISOString(), wpm, accuracy, duration: Math.round(seconds), errors });
    }
  };

  const bestWPM = typingResults.length > 0 ? Math.max(...typingResults.map(r => r.wpm)) : 0;
  const avgWPM = typingResults.length > 0 ? Math.round(typingResults.reduce((a, r) => a + r.wpm, 0) / typingResults.length) : 0;

  return (
    <div className="axiom-view axiom-typing">
      <div className="axiom-typing-stats-row">
        <div className="axiom-typing-stat"><span className="axiom-stat-big">{bestWPM}</span><span className="axiom-muted">best WPM</span></div>
        <div className="axiom-typing-stat"><span className="axiom-stat-big">{avgWPM}</span><span className="axiom-muted">avg WPM</span></div>
        <div className="axiom-typing-stat"><span className="axiom-stat-big">{typingResults.length}</span><span className="axiom-muted">tests</span></div>
      </div>
      <div className="axiom-typing-area">
        <div className="axiom-typing-text">
          {sample.split('').map((char, i) => {
            let cls = 'axiom-char';
            if (i < input.length) cls += input[i] === char ? ' correct' : ' incorrect';
            else if (i === input.length) cls += ' cursor';
            return <span key={i} className={cls}>{char}</span>;
          })}
        </div>
        <input ref={inputRef} className="axiom-typing-input" value={input} onChange={handleChange}
          disabled={finished} placeholder={started ? '' : 'Start typing…'} autoFocus />
        {started && !finished && (
          <div className="axiom-typing-live">
            <span>{formatWPM(input.split(' ').length / Math.max(elapsed / 60000, 0.001))}</span>
            <span className="axiom-muted">{(elapsed / 1000).toFixed(1)}s</span>
          </div>
        )}
        {finished && <div className="axiom-typing-result"><p>✓ Complete!</p><button className="axiom-btn axiom-btn-primary" onClick={reset}>Try Another</button></div>}
        {!started && <button className="axiom-btn" onClick={reset}>New Text</button>}
      </div>
      <div className="axiom-typing-history">
        <h3>Recent Tests</h3>
        <div className="axiom-typing-history-list">
          {typingResults.slice(-10).reverse().map(r => (
            <div key={r.id} className="axiom-typing-history-item">
              <span className="axiom-muted">{formatDate(r.date, 'short')}</span>
              <span>{formatWPM(r.wpm)}</span>
              <span>{formatAccuracy(r.accuracy)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}