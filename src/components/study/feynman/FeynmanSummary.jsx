import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import LatexRenderer from '@/components/shared/LatexRenderer';

export default function FeynmanSummary({
  conceptThreads,
  concepts,
  discussedConceptIds,
  returnHref = '/home',
}) {
  const discussed = concepts.filter((c) => discussedConceptIds.includes(c.id));
  const [selectedId, setSelectedId] = useState(discussed[0]?.id ?? '');
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  const selected = discussed.find((c) => c.id === selectedId) ?? discussed[0];
  const summary = selected ? conceptThreads[selected.id]?.summary : null;
  const confidence = summary?.confidencePercent ?? 0;

  if (!discussed.length) {
    return (
      <main className="study-mode-view session-summary-view feynman-summary">
        <p className="journeys-status">No concepts were discussed in this session.</p>
        <div className="action-row summary-actions">
          <div />
          <Link to={returnHref} className="btn btn-primary">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="study-mode-view session-summary-view feynman-summary">
      <div className="summary-stats feynman-summary-stats">
        <div className="stat-box feynman-stat-concept">
          <label className="feynman-summary-select-label" htmlFor="feynman-top-concept">
            Concepts discussed
          </label>
          <select
            id="feynman-top-concept"
            className="feynman-summary-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {discussed.map((c) => (
              <option key={c.id} value={c.id}>{c.term}</option>
            ))}
          </select>
        </div>
        <div className="stat-box">
          <span className="stat-value">{confidence}%</span>
          <span className="stat-label">Confidence</span>
        </div>
      </div>

      <div className={`feynman-transcript-panel${transcriptOpen ? ' open' : ''}`}>
        <button
          type="button"
          className="feynman-transcript-toggle"
          onClick={() => setTranscriptOpen((o) => !o)}
        >
          <span>Full conversation</span>
          {transcriptOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {transcriptOpen && (
          <div className="feynman-transcript-body">
            {discussed.map((concept) => {
              const thread = conceptThreads[concept.id];
              const msgs = thread?.messages?.filter((m) => m.type !== 'opening') ?? [];
              if (!msgs.length) return null;
              return (
                <div key={concept.id} className="feynman-transcript-concept">
                  <h4>{concept.term}</h4>
                  {msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={`feynman-transcript-line feynman-transcript-line--${msg.role}`}
                    >
                      <span className="feynman-transcript-speaker">
                        {msg.role === 'user' ? 'You' : 'Student'}
                      </span>
                      <LatexRenderer text={msg.text} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <section className="feynman-analysis-section">
        <div className="feynman-analysis-header">
          <label className="feynman-summary-select-label" htmlFor="feynman-analysis-concept">
            Concept analysis
          </label>
          <select
            id="feynman-analysis-concept"
            className="feynman-summary-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {discussed.map((c) => (
              <option key={c.id} value={c.id}>{c.term}</option>
            ))}
          </select>
        </div>

        {summary ? (
          <div className="feynman-analysis-body">
            <div className="feynman-analysis-metrics">
              <div className="feynman-metric">
                <span className="feynman-metric-label">Confidence</span>
                <span className="feynman-metric-value">{summary.confidencePercent}%</span>
              </div>
              <div className="feynman-metric">
                <span className="feynman-metric-label">Thoroughness</span>
                <span className="feynman-metric-value feynman-metric-text">{summary.thoroughness}</span>
              </div>
            </div>

            <div className="feynman-analysis-grid">
              <div className="feynman-detail-block">
                <h4>Strengths</h4>
                {summary.strengths?.length ? (
                  <ul>{summary.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
                ) : (
                  <p className="feynman-detail-empty">—</p>
                )}
              </div>
              <div className="feynman-detail-block">
                <h4>Weaknesses</h4>
                {summary.weaknesses?.length ? (
                  <ul>{summary.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
                ) : (
                  <p className="feynman-detail-empty">None flagged</p>
                )}
              </div>
            </div>

            <div className="feynman-detail-block">
              <h4>Suggested next steps</h4>
              {summary.suggestedNextSteps?.length ? (
                <ul>{summary.suggestedNextSteps.map((s) => <li key={s}>{s}</li>)}</ul>
              ) : (
                <p className="feynman-detail-empty">—</p>
              )}
            </div>
          </div>
        ) : (
          <p className="journeys-status">Analysis unavailable for this concept.</p>
        )}
      </section>

      <div className="action-row summary-actions">
        <div />
        <Link to={returnHref} className="btn btn-primary">Back to Home</Link>
      </div>
    </main>
  );
}
