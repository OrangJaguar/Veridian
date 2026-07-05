import { useState } from 'react';
import { SIX_FAILURES } from './sixFailuresContent';

export default function LandingSixFailuresGrid() {
  const [activeId, setActiveId] = useState(SIX_FAILURES[0].id);
  const active = SIX_FAILURES.find((f) => f.id === activeId) ?? SIX_FAILURES[0];

  return (
    <section className="landing-section landing-failures-section">
      <div className="landing-section-inner">
        <h2 className="landing-section-title">Stop guessing why you failed.</h2>
        <p className="landing-section-lead landing-section-lead-short">
          Six ways studying breaks down. Veridian finds which one is yours — from your actual sessions, not a personality quiz.
        </p>
        <div className="landing-failures-grid">
          {SIX_FAILURES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`landing-failure-card${activeId === item.id ? ' is-active' : ''}`}
              onMouseEnter={() => setActiveId(item.id)}
              onFocus={() => setActiveId(item.id)}
              onClick={() => setActiveId(item.id)}
            >
              <h3 className="landing-failure-title">{item.title}</h3>
              <p className="landing-failure-summary">{item.summary}</p>
            </button>
          ))}
        </div>
        <div className="landing-failures-detail" aria-live="polite">
          <span className="landing-failures-detail-label">How Veridian catches it</span>
          <p className="landing-failures-detail-text">{active.detection}</p>
        </div>
      </div>
    </section>
  );
}
