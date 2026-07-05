import { LandingHeroScene } from '@/components/landing/LandingVisuals';

const POINTS = [
  'Drop your syllabus, slides, or type a topic — we build the Journey from your material.',
  'Due Today sizes each session to your exam date so you never wonder if you have time.',
  'One Focus card tells you exactly what to do next to close the gaps we found.',
];

export default function LandingAntidoteSection() {
  return (
    <section className="landing-section landing-antidote-section">
      <div className="landing-section-inner landing-split-block landing-split-visual-right landing-split-block--balanced">
        <div className="landing-split-copy">
          <h2 className="landing-section-title landing-section-title-left">Zero friction. Absolute certainty.</h2>
          <p className="landing-section-lead landing-section-lead-left">
            You shouldn&apos;t have to decide what to study tonight. Veridian turns your material into a daily queue — sized to your deadline, ordered by what you actually need.
          </p>
          <ul className="landing-antidote-points">
            {POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="landing-antidote-visual">
          <LandingHeroScene />
        </div>
      </div>
    </section>
  );
}
