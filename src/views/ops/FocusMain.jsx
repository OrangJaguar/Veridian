import React, { useState, useEffect, useRef } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { formatDuration } from '../../lib/utils-date';

export default function FocusMain() {
  const { settings, addPomodoroSession, pomodoroSessions } = useAxiomStore();
  const { workDuration, shortBreak, longBreak, sessionsBeforeLongBreak } = settings.focusSettings;

  const [mode, setMode] = useState('work');
  const [secondsLeft, setSecondsLeft] = useState(workDuration * 60);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  const getDuration = (m) => {
    if (m === 'work') return workDuration;
    if (m === 'short_break') return shortBreak;
    return longBreak;
  };

  const switchMode = (m) => {
    setMode(m);
    setSecondsLeft(getDuration(m) * 60);
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleComplete = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    addPomodoroSession({ date: new Date().toISOString(), duration: getDuration(mode), type: mode, completed: true });
    if (mode === 'work') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      switchMode(newCount % sessionsBeforeLongBreak === 0 ? 'long_break' : 'short_break');
    } else {
      switchMode('work');
    }
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) { handleComplete(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const progress = 1 - secondsLeft / (getDuration(mode) * 60);
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = pomodoroSessions.filter(s => s.date.startsWith(today) && s.type === 'work' && s.completed);
  const totalTodayMinutes = todaySessions.reduce((a, s) => a + s.duration, 0);

  return (
    <div className="axiom-view axiom-focus">
      <div className="axiom-focus-mode-tabs">
        {['work', 'short_break', 'long_break'].map(m => (
          <button key={m} className={`axiom-focus-tab ${mode === m ? 'active' : ''}`} onClick={() => switchMode(m)}>
            {m === 'work' ? 'Focus' : m === 'short_break' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>
      <div className="axiom-focus-timer-wrap">
        <svg className="axiom-focus-ring" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--accent, #6366f1)" strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 54}`}
            strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress)}`}
            strokeLinecap="round" transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.5s' }} />
        </svg>
        <div className="axiom-focus-time">{formatDuration(secondsLeft)}</div>
      </div>
      <div className="axiom-focus-controls">
        <button className="axiom-btn axiom-btn-primary axiom-btn-lg" onClick={() => setRunning(r => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="axiom-btn" onClick={() => { setRunning(false); setSecondsLeft(getDuration(mode) * 60); }}>Reset</button>
      </div>
      <div className="axiom-focus-stats">
        <div className="axiom-focus-stat"><span className="axiom-stat-big">{todaySessions.length}</span><span className="axiom-muted">sessions today</span></div>
        <div className="axiom-focus-stat"><span className="axiom-stat-big">{totalTodayMinutes}m</span><span className="axiom-muted">focused today</span></div>
        <div className="axiom-focus-stat"><span className="axiom-stat-big">{sessionCount}</span><span className="axiom-muted">this run</span></div>
      </div>
    </div>
  );
}