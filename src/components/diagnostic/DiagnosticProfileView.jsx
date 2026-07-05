import { Link } from 'react-router-dom';
import { parseDiagnosticSummaryJson } from '@/utils/study/diagnosticPlacement';
import {
  failureModeToActivity,
  getWeakestDiagnosticModule,
} from '@/utils/study/diagnosticWeakness';

function ProfileBar({ label, value, pending = false }) {
  return (
    <div className="diagnostic-profile-bar">
      <div className="diagnostic-profile-bar-head">
        <span className="diagnostic-profile-bar-label">{label}</span>
        <span className="diagnostic-profile-bar-value">
          {pending ? 'Pending' : `${value ?? 0}%`}
        </span>
      </div>
      <div className="diagnostic-profile-bar-track">
        <div
          className="diagnostic-profile-bar-fill"
          style={{ width: pending ? '0%' : `${value ?? 0}%` }}
        />
      </div>
    </div>
  );
}

const SIGNAL_LABELS = {
  verbatimTrap: 'Verbatim trap — memorized wording, weak transfer',
  transferFailure: 'Transfer failure — struggles in novel contexts',
  conceptualGap: 'Conceptual gap — fundamentals need work',
  pressureCollapse: 'Pressure collapse — accuracy drops under time',
};

export default function DiagnosticProfileView({
  journey,
  modules,
  moduleResults,
  profile,
  journeyId,
  continueHref,
}) {
  const summary = parseDiagnosticSummaryJson(journey) ?? { profile, moduleResults };
  const displayProfile = profile ?? summary.profile ?? {};
  const results = [...(moduleResults ?? summary.moduleResults ?? [])].sort(
    (a, b) => (a.applicationDepth ?? a.accuracy) - (b.applicationDepth ?? b.accuracy),
  );
  const weakest = getWeakestDiagnosticModule(journey ?? { diagnosticSummary: JSON.stringify(summary) }, modules);
  const weakestMod = modules.find((m) => m.moduleId === weakest?.moduleId);
  const primarySignal = weakest?.failureSignals?.[0];
  const primaryActivity = failureModeToActivity(primarySignal, weakest?.assignedStage ?? 'A');

  const startHref = weakestMod
    ? `/journeys/${journeyId}/modules/${weakestMod.moduleId}`
    : continueHref;

  return (
    <div className="diagnostic-profile-view">
      <header className="diagnostic-profile-header">
        <h2 className="diagnostic-profile-title">Here&apos;s where you stand</h2>
        <p className="diagnostic-profile-lead">
          Your diagnostic mapped how your knowledge holds up across recognition, application, and transfer.
        </p>
      </header>

      <div className="diagnostic-profile-bars">
        <ProfileBar label="Knowledge coverage" value={displayProfile.knowledgeCoverage} />
        <ProfileBar label="Application depth" value={displayProfile.applicationDepth} />
        <ProfileBar
          label="Pressure readiness"
          value={displayProfile.pressureReadiness}
          pending={displayProfile.pressureReadiness == null}
        />
      </div>

      {primarySignal && (
        <p className="diagnostic-profile-gap">
          {SIGNAL_LABELS[primarySignal] ?? 'We found a specific gap to target first.'}
        </p>
      )}

      <section className="diagnostic-profile-plan" aria-label="Your study plan">
        <h3 className="diagnostic-section-title">Your plan</h3>
        <ul className="diagnostic-profile-module-list">
          {results.map((result) => (
            <li key={result.moduleId} className="diagnostic-profile-module-item">
              <div className="diagnostic-profile-module-head">
                <span className="diagnostic-module-name">{result.moduleName}</span>
                <span className={`diagnostic-stage-badge stage-${result.assignedStage.toLowerCase()}`}>
                  Stage {result.assignedStage}
                </span>
              </div>
              <p className="diagnostic-profile-module-meta">
                Application depth {result.applicationDepth ?? result.accuracy}%
                {result.failureSignals?.length
                  ? ` · ${result.failureSignals.map((s) => SIGNAL_LABELS[s] ?? s).join('; ')}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="diagnostic-profile-actions">
        <Link to={startHref} className="btn btn-primary">
          {weakestMod
            ? `Start with ${weakestMod.name}`
            : 'Continue to journey'}
        </Link>
        <Link to={continueHref ?? `/journeys/${journeyId}`} className="btn btn-secondary">
          View full journey
        </Link>
        {primaryActivity && (
          <p className="diagnostic-profile-next-hint">
            First focus: {primaryActivity === 'learningGuide' ? 'Learning Guide' : 'Practice Quiz'}
            {weakestMod ? ` — ${weakestMod.name}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
