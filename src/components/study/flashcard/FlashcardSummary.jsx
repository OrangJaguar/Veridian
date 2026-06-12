import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatStudyTime } from '@/utils/study/feedback';
import { buildMasterySummaryRows, formatMasteryCopyText } from '@/utils/study/masteryStats';

export default function FlashcardSummary({
  cards,
  masteryStatsByCard,
  totalTimeSec,
  returnHref = '/home',
}) {
  const [copied, setCopied] = useState(false);
  const rows = buildMasterySummaryRows(cards, masteryStatsByCard);
  const masteredLabel = `${rows.length}/${rows.length}`;

  const handleCopy = async () => {
    const text = formatMasteryCopyText({
      mastered: masteredLabel,
      totalTime: formatStudyTime(totalTimeSec),
      rows,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <main className="study-mode-view session-summary-view">
      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{masteredLabel}</span>
          <span className="stat-label">Mastered</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{formatStudyTime(totalTimeSec)}</span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>

      <div className="review-list">
        {rows.map((r, idx) => (
          <div key={r.front + idx} className={`review-item ${r.rowClass}`}>
            <div className="review-meta-bar">
              <div className="review-q">{idx + 1}. {r.front}</div>
              <div className="review-tta">{r.totalSec.toFixed(1)}s</div>
            </div>
            <div className="review-a">
              {r.quality}
              <br />
              Recall: {r.recallSec.toFixed(1)}s · Typing: {r.typingSec.toFixed(1)}s · Total: {r.totalSec.toFixed(1)}s
              <br />
              Attempts: {r.totalAttempts} · Typing mistakes: {r.typingWrongAttempts} · Skips: {r.typingSkippedCount} · Recall retries: {r.recallAgainCount}
            </div>
          </div>
        ))}
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
