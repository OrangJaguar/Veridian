import { Link } from 'react-router-dom';
import StudyAiRawPanel from '@/components/study/StudyAiRawPanel';
import {
  formatStudyAiDebugSummary,
  isStudyAiDebugEnabled,
  getLastRawGemini,
} from '@/utils/study/studyAiTrace';

const FRIENDLY_PARSE_MSG = 'We had trouble formatting the AI response. This usually fixes itself on retry.';

function friendlyMessage(message, error) {
  const text = message ?? error?.message ?? '';
  if (/invalid format|AI returned|Generated \d+\/\d+|validation|parse|JSON/i.test(text)) {
    return FRIENDLY_PARSE_MSG;
  }
  if (/timed out|timeout|504/i.test(text)) {
    return 'Generation took too long. Please try again.';
  }
  if (/Daily AI limit|token budget/i.test(text)) {
    return text;
  }
  if (/sign in/i.test(text)) {
    return text;
  }
  if (text && text.length < 200 && !/status code|zod|schema/i.test(text)) {
    return text;
  }
  return 'Something went wrong while generating study content. Please try again.';
}

export function StudyAiError({
  message = 'Something went wrong.',
  error,
  ticketRef,
  onRetry,
  onExit,
  retryLabel = 'Try again',
  exitLabel = 'Go back',
}) {
  const debugEnabled = isStudyAiDebugEnabled();
  const displayMessage = friendlyMessage(message, error);
  const ref = ticketRef ?? error?.ticketRef ?? null;
  const debugSummary = debugEnabled ? formatStudyAiDebugSummary(error) : null;
  const rawText = debugEnabled ? (error?.rawGeminiText ?? getLastRawGemini()) : null;
  const isQuotaError = error?.status === 429
    || /daily ai limit|token budget/i.test(message ?? '');

  return (
    <div className="study-mode-view study-ai-error">
      <div className="guide-empty study-ai-error-card">
        <h2 className="study-ai-error-title">Couldn&apos;t generate content</h2>
        <p className="study-ai-error-message">{displayMessage}</p>

        {ref && (
          <p className="study-ai-error-ticket">
            Reference: <code>{ref}</code>
          </p>
        )}

        {isQuotaError && (
          <p className="study-ai-quota-hint">
            <Link to="/ai-limit">View your daily AI usage and reset time</Link>
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

        {debugEnabled && debugSummary && (
          <pre className="study-ai-debug-panel">{debugSummary}</pre>
        )}
        {debugEnabled && rawText && (
          <StudyAiRawPanel
            text={rawText}
            title="Raw Gemini response (debug only)"
            subtitle="Visible because AI debug mode is on."
          />
        )}
      </div>
    </div>
  );
}
