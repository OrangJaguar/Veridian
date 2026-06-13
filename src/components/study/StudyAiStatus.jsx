import VeridianLoading from '@/components/shared/VeridianLoading';

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
  onRetry,
  onExit,
  retryLabel = 'Try again',
  exitLabel = 'Go back',
}) {
  return (
    <div className="study-mode-view study-ai-error">
      <div className="guide-empty">
        <p>{message}</p>
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
