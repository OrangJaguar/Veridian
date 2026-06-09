import { formatStudyTime } from '@/utils/study/feedback';

export default function StudyChrome({
  title,
  progressText,
  progressPct = 0,
  timerSec = 0,
  onExit,
  children,
}) {
  return (
    <div className="study-shell">
      <header className="study-chrome">
        <div className="study-chrome-left">
          {title && <span className="study-chrome-title">{title}</span>}
          {progressText && <span className="study-chrome-progress-text">{progressText}</span>}
          <div className="study-progress-bar">
            <div className="study-progress-fill" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
        </div>
        <div className="study-chrome-right">
          <span className="study-timer">{formatStudyTime(timerSec)}</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onExit}>
            Exit
          </button>
        </div>
      </header>
      <main className="study-chrome-body">{children}</main>
      <footer className="study-chrome-footer">
        <span className="study-keyboard-hint">1–4 select · Space flip · Esc exit</span>
      </footer>
    </div>
  );
}
