import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatStudyTime } from '@/utils/study/feedback';

function formatCopyText({
  moduleTitle,
  journeyTitle,
  response,
  characterCount,
  totalTimeSec,
  result,
  hintsUsed,
}) {
  const lines = [
    'Veridian — Free Recall Results',
    `Journey: ${journeyTitle ?? '—'}`,
    `Module: ${moduleTitle ?? '—'}`,
    `Characters: ${characterCount}`,
    `Time: ${formatStudyTime(totalTimeSec)}`,
    `Coverage: ${result?.coveragePercent ?? 0}% — ${result?.coverageEstimate ?? ''}`,
    `Hints used: ${hintsUsed}/3`,
    '',
    'Your response:',
    response,
    '',
    'Coverage estimate:',
    result?.coverageEstimate ?? '—',
    '',
    'Missed ideas:',
    ...(result?.missedIdeas?.length ? result.missedIdeas.map((i) => `- ${i}`) : ['—']),
    '',
    'Incorrect ideas:',
    ...(result?.incorrectIdeas?.length ? result.incorrectIdeas.map((i) => `- ${i}`) : ['None']),
    '',
    'Hints used:',
    result?.hintsUsedNote ?? '—',
    '',
    'Next concept to revisit:',
    result?.nextConceptToRevisit ?? result?.nextConceptRecommendation ?? '—',
    '',
    'Feedback:',
    result?.feedback ?? result?.aiGradingSummary ?? '—',
  ];
  return lines.join('\n').trim();
}

export default function FreeRecallSummary({
  response,
  characterCount,
  totalTimeSec,
  hintsUsed,
  result,
  moduleTitle,
  journeyTitle,
  returnHref = '/home',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = formatCopyText({
      moduleTitle,
      journeyTitle,
      response,
      characterCount,
      totalTimeSec,
      result,
      hintsUsed,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const missed = result?.missedIdeas ?? result?.conceptsMissed ?? [];
  const incorrect = result?.incorrectIdeas ?? [];
  const nextConcept = result?.nextConceptToRevisit ?? result?.nextConceptRecommendation ?? '—';
  const feedback = result?.feedback ?? result?.aiGradingSummary ?? '';

  return (
    <main className="study-mode-view session-summary-view free-recall-summary">
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{characterCount.toLocaleString()}</span>
          <span className="stat-label">Characters</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{formatStudyTime(totalTimeSec)}</span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>

      <div className="free-recall-summary-response">
        <h3 className="free-recall-summary-heading">Your response</h3>
        <div className="free-recall-summary-response-body">{response}</div>
      </div>

      <div className="summary-stats free-recall-summary-metrics">
        <div className="stat-box">
          <span className="stat-value">{result?.coveragePercent ?? 0}%</span>
          <span className="stat-label">Coverage estimate</span>
          {result?.coverageEstimate && (
            <span className="free-recall-summary-sub">{result.coverageEstimate}</span>
          )}
        </div>
        <div className="stat-box">
          <span className="stat-value">{hintsUsed}/3</span>
          <span className="stat-label">Hints used</span>
        </div>
      </div>

      <div className="free-recall-summary-feedback">
        <h3 className="free-recall-summary-heading">Grading</h3>
        {feedback && <p className="free-recall-summary-text">{feedback}</p>}

        <div className="free-recall-summary-details">
          <div className="free-recall-detail-block">
            <h4>Missed ideas</h4>
            {missed.length ? (
              <ul>{missed.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p className="free-recall-detail-empty">None flagged</p>
            )}
          </div>
          <div className="free-recall-detail-block">
            <h4>Incorrect ideas</h4>
            {incorrect.length ? (
              <ul>{incorrect.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p className="free-recall-detail-empty">None flagged</p>
            )}
          </div>
          {result?.hintsUsedNote && (
            <div className="free-recall-detail-block">
              <h4>Hints used</h4>
              <p>{result.hintsUsedNote}</p>
            </div>
          )}
          <div className="free-recall-detail-block">
            <h4>Next concept to revisit</h4>
            <p>{nextConcept}</p>
          </div>
        </div>
      </div>

      <div className="action-row summary-actions">
        <div>
          <button type="button" className="btn" onClick={handleCopy}>
            Copy Results
          </button>
          {copied && <span className="summary-copy-feedback">Copied!</span>}
        </div>
        <Link to={returnHref} className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
