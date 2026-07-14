import { useState } from 'react';
import { toast } from 'sonner';
import {
  useResearchDataHealth,
  useQualifyingPairs,
  useDataQualityFlags,
} from '@/hooks/queries/useResearchAnalytics';
import { exportResearchCsv } from '@/api/admin/researchAnalytics';
import VeridianLoading from '@/components/shared/VeridianLoading';

function pct(value) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButton({ exportKey, label }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { csv, filename } = await exportResearchCsv(exportKey);
      downloadCsv(csv, filename);
    } catch (err) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting…' : label}
    </button>
  );
}

export default function AdminResearchSection() {
  const { data: health, isPending: healthPending, isError: healthError, error: healthErr } = useResearchDataHealth();
  const { data: pairs = [], isPending: pairsPending, isError: pairsError, error: pairsErr } = useQualifyingPairs();
  const { data: flags = [], isPending: flagsPending, isError: flagsError, error: flagsErr } = useDataQualityFlags();

  if (healthPending && !health) {
    return <VeridianLoading />;
  }

  const loadError = healthError ? healthErr?.message : pairsError ? pairsErr?.message : flagsError ? flagsErr?.message : null;

  return (
    <div className="admin-research-section">
      {loadError ? (
        <p className="admin-dashboard-error" role="alert">
          Could not load research analytics: {loadError}
        </p>
      ) : null}

      <section className="research-section">
        <h2 className="research-section-title">Data health</h2>
        <div className="research-stats-grid">
          <div className="research-stat-card">
            <span className="research-stat-value">{health?.totalUniqueUsers ?? '—'}</span>
            <span className="research-stat-label">Unique users</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{health?.totalSessionsCompleted ?? '—'}</span>
            <span className="research-stat-label">Sessions completed</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{health?.quizSessionsWithConfidenceSlider ?? '—'}</span>
            <span className="research-stat-label">Quiz sessions with confidence slider</span>
          </div>
          <div className="research-stat-card research-stat-card--warn">
            <span className="research-stat-value">{health?.quizSessionsWithoutConfidenceSlider ?? '—'}</span>
            <span className="research-stat-label">Quiz sessions missing slider</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{pct(health?.baselineCompletionRate)}</span>
            <span className="research-stat-label">Baseline completion rate</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{pct(health?.baselineSkipRate)}</span>
            <span className="research-stat-label">Baseline skip rate</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{pct(health?.maiOnboardingCompletionRate)}</span>
            <span className="research-stat-label">MAI onboarding completion</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{pct(health?.maiDay60CompletionRate)}</span>
            <span className="research-stat-label">MAI day-60 completion</span>
          </div>
          <div className="research-stat-card">
            <span className="research-stat-value">{pct(health?.masterySnapshotDay7Coverage)}</span>
            <span className="research-stat-label">Day-7 snapshot coverage</span>
          </div>
        </div>
      </section>

      <section className="research-section">
        <div className="research-section-head">
          <h2 className="research-section-title">Qualifying user-module pairs (≥10 quiz sessions)</h2>
          <ExportButton exportKey="qualifyingPairs" label="Export CSV" />
        </div>
        {pairsPending ? (
          <VeridianLoading />
        ) : (
          <div className="research-table-wrap">
            <table className="research-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Subject</th>
                  <th>Journey</th>
                  <th>Sessions</th>
                  <th>Baseline</th>
                  <th>Mastery</th>
                  <th>Day 7</th>
                  <th>Day 30</th>
                  <th>Day 60</th>
                  <th>Brier</th>
                  <th>Active @60</th>
                  <th>MAI onb.</th>
                  <th>MAI 60</th>
                </tr>
              </thead>
              <tbody>
                {pairs.length === 0 && (
                  <tr><td colSpan={13} className="research-table-empty">No qualifying pairs yet</td></tr>
                )}
                {pairs.map((row, i) => (
                  <tr key={`${row.anonymizedUserId}-${row.journeyTitle}-${i}`}>
                    <td>{row.anonymizedUserId}</td>
                    <td>{row.moduleSubject}</td>
                    <td>{row.journeyTitle}</td>
                    <td>{row.sessionsCompleted}</td>
                    <td>{row.baselineScore ?? '—'}</td>
                    <td>{row.currentMastery ?? '—'}</td>
                    <td>{row.day7SnapshotMastery ?? '—'}</td>
                    <td>{row.day30SnapshotMastery ?? '—'}</td>
                    <td>{row.day60SnapshotMastery ?? '—'}</td>
                    <td>{row.meanBrierScore != null ? row.meanBrierScore.toFixed(3) : '—'}</td>
                    <td>{row.activeAtDay60 == null ? '—' : (row.activeAtDay60 ? 'yes' : 'no')}</td>
                    <td>{row.maiOnboardingScore ?? '—'}</td>
                    <td>{row.maiDay60Score ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="research-section">
        <h2 className="research-section-title">Data quality flags</h2>
        {flagsPending ? (
          <VeridianLoading />
        ) : (
          <ul className="research-flags-list">
            {flags.length === 0 && <li className="research-flag-item">No issues detected</li>}
            {flags.map((flag, i) => (
              <li key={i} className="research-flag-item research-flag-item--warn">
                <strong>{flag.type}</strong>
                {' — '}
                {flag.moduleId && `module ${flag.moduleId}`}
                {flag.sessionId && ` session ${flag.sessionId}`}
                {flag.snapshotDay && ` day-${flag.snapshotDay} snapshot`}
                {flag.sessionCount && ` (${flag.sessionCount} sessions)`}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="research-section">
        <h2 className="research-section-title">Research exports</h2>
        <div className="research-export-actions">
          <ExportButton exportKey="qualifyingPairs" label="Qualifying pairs" />
          <ExportButton exportKey="sessions" label="All completed sessions" />
          <ExportButton exportKey="masterySnapshots" label="Mastery snapshots" />
          <ExportButton exportKey="surveyResponses" label="Survey responses" />
        </div>
      </section>
    </div>
  );
}
