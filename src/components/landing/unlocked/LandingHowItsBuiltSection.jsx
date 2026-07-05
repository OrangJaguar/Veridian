import LandingJourneyArchitecture from './LandingJourneyArchitecture';
import LandingActivityExplorer from './LandingActivityExplorer';

export default function LandingHowItsBuiltSection() {
  return (
    <section className="landing-section landing-built-section">
      <div className="landing-section-inner">
        <div className="landing-built-header">
          <h2 className="landing-section-title landing-section-title-left">How it&apos;s built.</h2>
          <p className="landing-section-lead landing-section-lead-left">
            Journeys are the main container. Inside each Journey are Modules — individual concept units from your source material. Every Module moves through three stages before it sticks.
          </p>
        </div>

        <LandingJourneyArchitecture />

        <div className="landing-built-activities-block">
          <h3 className="landing-built-subtitle">What you actually do in each stage</h3>
          <LandingActivityExplorer />
        </div>

        <div className="landing-built-footer-grid">
          <article className="landing-built-footer-card">
            <span className="landing-built-footer-eyebrow">Under the hood</span>
            <h3>FSRS scheduling</h3>
            <p>
              The FSRS engine decides exactly when each concept needs to surface again based on your performance history. It&apos;s not random — it&apos;s a mathematical model of how human memory actually works.
            </p>
          </article>
          <article className="landing-built-footer-card">
            <span className="landing-built-footer-eyebrow">Community</span>
            <h3>Library</h3>
            <p>
              Students can publish a Journey so others clone the structure, plug in their own deadline, and start studying. You share the layout — your personal progress and data always stay yours.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
