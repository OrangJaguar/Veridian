import { useId, useState } from 'react';

export default function WeeklyPlanTrustExplainer({ factors = [], strategy = '' }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!factors.length && !strategy) return null;

  return (
    <div className="plan-trust-explainer">
      <button
        type="button"
        className="plan-trust-explainer-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        How this plan is built
      </button>

      {open && (
        <div
          id={panelId}
          className="plan-trust-explainer-panel"
          role="region"
          aria-label="Weekly plan explanation"
        >
          {strategy && (
            <p className="plan-trust-explainer-strategy">{strategy}</p>
          )}
          <ul className="plan-trust-factor-list">
            {factors.map((factor, index) => (
              <li
                key={factor.id}
                className={`plan-trust-factor plan-trust-factor--${factor.weight ?? 'medium'}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="plan-trust-factor-main">
                  <span className="plan-trust-factor-label">{factor.label}</span>
                  <span className="plan-trust-factor-value">{factor.value}</span>
                </div>
                {factor.detail && (
                  <p className="plan-trust-factor-detail">{factor.detail}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="plan-trust-explainer-note">
            These factors update after study sessions. Skipping a day does not break the system.
          </p>
        </div>
      )}
    </div>
  );
}
