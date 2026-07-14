import { useState } from 'react';
import { buildLandingFailuresContent } from '@/utils/failures/buildLandingFailuresContent';
import FailureModeIcon from '@/components/failures/FailureModeIcon';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

const SIX_FAILURES = buildLandingFailuresContent();

export default function LandingSixFailuresGrid() {
  const [activeId, setActiveId] = useState(SIX_FAILURES[0].id);
  const active = SIX_FAILURES.find((f) => f.id === activeId) ?? SIX_FAILURES[0];

  return (
    <section className="landing-section landing-failures-section" id="failure-modes">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Stop guessing why you failed.</h2>
        <p className="landing-section-lead landing-section-lead-short">
          Six ways studying breaks down. Veridian finds which one is yours — from your actual sessions, not a personality quiz.
        </p>
        <div className="landing-failures-grid">
          {SIX_FAILURES.map((item) => (
            <button
              key={item.id}
              id={`failure-mode-${item.id}`}
              type="button"
              className={`landing-failure-card ${getFailureModeClassName(item.id)}${activeId === item.id ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              onClick={() => setActiveId(item.id)}
            >
              <FailureModeIcon modeId={item.id} size={22} className="landing-failure-card-icon" />
              <h3 className="landing-failure-title">{item.title}</h3>
              <p className="landing-failure-summary">{item.summary}</p>
            </button>
          ))}
        </div>
        <div className="landing-failures-detail" aria-live="polite">
          <div className={`landing-failures-detail-header ${getFailureModeClassName(active.id)}`}>
            <FailureModeIcon modeId={active.id} size={20} />
            <span className="landing-failures-detail-mode">{active.title}</span>
          </div>
          <span className="landing-failures-detail-label">How Veridian catches it</span>
          <p className="landing-failures-detail-text">{active.detection}</p>
        </div>
      </div>
    </section>
  );
}
