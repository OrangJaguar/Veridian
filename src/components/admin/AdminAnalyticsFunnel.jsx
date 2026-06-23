import { useAdminFunnelAnalytics } from '@/hooks/queries/useAdminAnalytics';

function FunnelBar({ step, maxCount }) {
  const width = maxCount > 0 ? Math.max(4, Math.round((step.count / maxCount) * 100)) : 0;
  return (
    <div className="admin-funnel-row">
      <div className="admin-funnel-row-head">
        <span className="admin-funnel-label">{step.label}</span>
        <span className="admin-funnel-metrics">
          <strong>{step.count}</strong>
          {step.conversionFromTop != null && (
            <span className="admin-funnel-pct">{step.conversionFromTop}% of top</span>
          )}
          {step.dropFromPrev > 0 && (
            <span className="admin-funnel-drop">−{step.dropFromPrev}% drop</span>
          )}
        </span>
      </div>
      <div className="admin-funnel-bar-track" aria-hidden>
        <div className="admin-funnel-bar-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function FunnelSection({ title, steps }) {
  if (!steps?.length) return null;
  const maxCount = Math.max(...steps.map((s) => s.count), 1);
  return (
    <div className="admin-funnel-block">
      <h3 className="admin-chart-title">{title}</h3>
      {steps.map((step) => (
        <FunnelBar key={step.key ?? step.label} step={step} maxCount={maxCount} />
      ))}
    </div>
  );
}

export default function AdminAnalyticsFunnel() {
  const { data, isLoading, isError } = useAdminFunnelAnalytics();

  if (isLoading) return <p className="journeys-status">Loading funnel analytics…</p>;
  if (isError || !data) return <p className="journeys-status">Could not load funnel analytics.</p>;

  return (
    <section className="admin-dashboard-section" aria-label="Funnel analytics">
      <h2 className="admin-section-title">Analytics — drop-off funnel</h2>
      <p className="admin-dashboard-lead">
        See where visitors and new users leave. Pre-signup steps use anonymous page events;
        post-signup steps use account and session data.
      </p>

      {!data.eventTrackingActive && (
        <p className="admin-funnel-note">
          Pre-signup event tracking is warming up — visit the landing page while logged out to seed data.
        </p>
      )}

      <div className="admin-funnel-grid">
        <FunnelSection title="Before account (anonymous)" steps={data.preSignup} />
        <FunnelSection title="After account created" steps={data.postSignup} />
      </div>

      {data.d7RetentionRate != null && (
        <p className="admin-funnel-retention">
          7-day retention (users who signed up 7+ days ago and were active this week):{' '}
          <strong>{data.d7RetentionRate}%</strong>
        </p>
      )}

      {data.onboardingSteps?.length > 0 && (
        <div className="admin-funnel-block admin-funnel-onboarding">
          <h3 className="admin-chart-title">Onboarding step reach</h3>
          <div className="admin-onboarding-steps">
            {data.onboardingSteps.map((step) => (
              <div key={step.step} className="admin-onboarding-step">
                <span className="admin-onboarding-step-label">{step.label}</span>
                <span className="admin-onboarding-step-count">{step.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
