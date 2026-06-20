import StudyAiRawPanel from '@/components/study/StudyAiRawPanel';
import {
  formatStudyAiDebugSummary,
  isStudyAiDebugEnabled,
  getLastRawGemini,
} from '@/utils/study/studyAiTrace';

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
  const rawText = error?.rawGeminiText ?? getLastRawGemini();

  return (
    <div className="study-mode-view study-ai-error">
      <div className="guide-empty">
        <p>{message}</p>
        {debugSummary && (
          <pre className="study-ai-debug-panel">{debugSummary}</pre>
        )}
        {rawText && (
          <StudyAiRawPanel
            text={rawText}
            title="Raw Gemini response (from failed request)"
            subtitle="Captured before or during the server error — unparsed."
          />
        )}
        {isStudyAiDebugEnabled() && !rawText && (
          <p className="study-ai-debug-hint">
            No raw text yet. Run <code>veridianAiDebug.rawOn()</code>, reload, and retry — or check Network → geminiStudy response for <code>rawGeminiText</code>.
          </p>
        )}
        {isStudyAiDebugEnabled() && rawText && (
          <p className="study-ai-debug-hint">
            Also in console: <code>veridianAiDebug.printRaw()</code>
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
