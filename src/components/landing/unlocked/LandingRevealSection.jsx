import { getBaselineOutcome, getBaselineRevealSeen } from '@/lib/baselineStorage';
import LandingRevealContent from '@/components/landing/baseline/LandingRevealContent';
import LandingUploadCta from './LandingUploadCta';

export default function LandingRevealSection() {
  const outcome = getBaselineOutcome();
  const revealSeen = getBaselineRevealSeen();
  const displayOutcome = outcome === 'skipped' || !outcome ? 'failed' : outcome;

  if (revealSeen && outcome !== 'skipped') {
    return (
      <section className="landing-section landing-reveal-block landing-reveal-block--compact" data-landing-section="reveal">
        <div className="landing-section-inner landing-reveal-compact">
          <p className="landing-reveal-compact-text">
            You experienced the gap between recognition and real recall. Veridian trains the second kind — on your actual material.
          </p>
          <LandingUploadCta variant="primary" source="landing_reveal_compact" />
        </div>
      </section>
    );
  }

  return (
    <section className="landing-section landing-reveal-block" data-landing-section="reveal">
      <div className="landing-section-inner">
        <LandingRevealContent outcome={displayOutcome} />
      </div>
    </section>
  );
}
