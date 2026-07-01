import { Link } from 'react-router-dom';
import StudyAiRawPanel from '@/components/study/StudyAiRawPanel';
import {
  formatStudyAiDebugSummary,
  isStudyAiDebugEnabled,
  getLastRawGemini,
} from '@/utils/study/studyAiTrace';
import { classifyAiFailure } from '@/utils/ai/invokeWithRetry';

const FRIENDLY_PARSE_MSG = 'We had trouble formatting the AI response. This usually fixes itself when you continue.';

function buildRecoveryMessage(message, error, progress) {
  const text = message ?? error?.message ?? '';
  const kind = classifyAiFailure(error ?? { message: text });

  if (progress?.completed != null && progress?.total != null && progress.completed > 0) {
    const label = progress.label ?? 'steps';
    if (/authentication required|please sign in/i.test(text)) {
      return `Your session hiccuped, but we saved batch ${progress.completed} of ${progress.total}. Tap Continue generating to finish.`;
    }
    return `We saved your progress through ${progress.completed} of ${progress.total} ${label}. Tap Continue generating to finish the rest.`;
  }

  if (kind === 'timeout') {
    return 'This is taking longer than usual. Your progress may be saved — tap Continue generating to pick up where we left off.';
  }
  if (kind === 'parse') return FRIENDLY_PARSE_MSG;
  if (kind === 'quota') return text || 'Daily AI limit reached. Try again tomorrow.';
  if (/sign in/i.test(text)) return text;
  if (text && text.length < 200 && !/status code|zod|schema/i.test(text)) return text;
  return 'Generation paused before finishing. Tap Continue generating to resume.';
}

function friendlyMessage(message, error, progress) {
  return buildRecoveryMessage(message, error, progress);
}

/**
 * Unified AI failure card with recovery-first copy.
 */
export function AiFailureCard({
  title = "Couldn't finish generating",
  message,
  error,
  ticketRef,
  variant = 'study',
  progress = null,
  onRetry,
  onExit,
  retryLabel = 'Continue generating',
  exitLabel = 'Go back',
  extraActions = null,
}) {
  const debugEnabled = isStudyAiDebugEnabled();
  const displayMessage = friendlyMessage(message, error, progress);
  const ref = ticketRef ?? error?.ticketRef ?? null;
  const debugSummary = debugEnabled ? formatStudyAiDebugSummary(error) : null;
  const rawText = debugEnabled ? (error?.rawGeminiText ?? getLastRawGemini()) : null;
  const isQuotaError = error?.status === 429
    || /daily ai limit|token budget/i.test(message ?? '');

  return (
    <div className={`study-mode-view study-ai-error study-ai-error--${variant}`}>
      <div className="guide-empty study-ai-error-card">
        <h2 className="study-ai-error-title">{title}</h2>
        <p className="study-ai-error-message">{displayMessage}</p>

        {progress?.completed > 0 && progress?.total > 0 && (
          <p className="study-ai-error-progress">
            Saved: {progress.completed} of {progress.total} {progress.label ?? 'steps'}
          </p>
        )}

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
          {extraActions}
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

/** @deprecated Use AiFailureCard — kept for existing imports */
export function StudyAiError(props) {
  return <AiFailureCard {...props} />;
}
