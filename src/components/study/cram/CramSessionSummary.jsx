import { Link } from 'react-router-dom';
import { formatStudyTime } from '@/utils/study/feedback';
import { accuracyDotClass } from '@/utils/study/challengeAnalysis';

export default function CramSessionSummary({
  answers = [],
  modules = [],
  selectedModuleIds = [],
  perModuleAccuracy = {},
  hardestConceptTag,
  totalTimeSec,
  returnHref,
  onGoAgain,
}) {
  const answered = answers.filter(Boolean).length;

  const selectedModules = modules.filter((m) => selectedModuleIds.includes(m.moduleId));

  return (
    <main className="study-mode-view session-summary-view cram-summary">
      <h1 className="cram-summary-title">Cram session complete</h1>

      <div className="summary-stats">
        <div className="stat-box">
          <span className="stat-value">{answered}</span>
          <span className="stat-label">Questions answered</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{formatStudyTime(totalTimeSec ?? 0)}</span>
          <span className="stat-label">Total time</span>
        </div>
      </div>

      {hardestConceptTag && (
        <p className="cram-hardest-callout">
          Hardest topic: <strong>{hardestConceptTag}</strong>
        </p>
      )}

      {selectedModules.length > 0 && (
        <div className="cram-module-dots">
          {selectedModules.map((m) => {
            const acc = perModuleAccuracy[m.moduleId];
            const dotClass = acc != null ? accuracyDotClass(acc) : 'mid';
            return (
              <span key={m.moduleId} className="cram-module-dot-chip">
                <span className={`cram-module-dot ${dotClass}`} aria-hidden />
                {m.name}
              </span>
            );
          })}
        </div>
      )}

      <div className="summary-actions cram-summary-actions">
        <button type="button" className="btn btn-primary cram-go-again" onClick={onGoAgain}>
          Go again
        </button>
        <Link to={returnHref} className="btn btn-secondary btn-sm">Done</Link>
      </div>
    </main>
  );
}
