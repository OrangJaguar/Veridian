import VeridianLoading from '@/components/shared/VeridianLoading';
import {
  formatStudyAiDebugSummary,
  isStudyAiDebugEnabled,
} from '@/utils/study/studyAiTrace';

export function StudyAiLoading({ label = 'Generating…', className = 'study-mode-view guide-mode-view guide-mode-view--loading' }) {
  return (
    <div className={className}>
      <VeridianLoading fullPage />
      <p className="guide-generating-label">{label}</p>
    </div>
  );
}

export function StudyAiError({
  message = 'Something went wrong.',
  error,
  onRetry,
  onExit,
  retryLabel = 'Try again',
  exitLabel = 'Go back',
}) {
  const debugSummary = isStudyAiDebugEnabled()
    ? formatStudyAiDebugSummary(error)
    : null;

  return (
    <div className="study-mode-view study-ai-error">
      <div className="guide-empty">
        <p>{message}</p>
        {debugSummary && (
          <pre className="study-ai-debug-panel">{debugSummary}</pre>
        )}
        {isStudyAiDebugEnabled() && (
          <p className="study-ai-debug-hint">
            Open console and run <code>veridianAiDebug.printLast()</code> for full step detail.
          </p>
        )}
        <div className="study-ai-error-actions">
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {onExit && (
            <button type="button" className="btn btn-secondary" onClick={onExit}>
              {exitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
