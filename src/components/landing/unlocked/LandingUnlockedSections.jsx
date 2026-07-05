import { useEffect, useRef } from 'react';
import { trackProductEventOnce } from '@/lib/analytics';
import LandingUploadCta from './LandingUploadCta';
import LandingRevealSection from './LandingRevealSection';
import LandingSixFailuresGrid from './LandingSixFailuresGrid';
import LandingOriginStory from './LandingOriginStory';
import LandingHowItsBuiltSection from './LandingHowItsBuiltSection';
import LandingAntidoteSection from './LandingAntidoteSection';
import LandingFinalCta from './LandingFinalCta';

function useLandingScrollDepth() {
  const fired = useRef(new Set());

  useEffect(() => {
    const sections = document.querySelectorAll('[data-landing-section]');
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-landing-section');
          const milestones = {
            reveal: 25,
            failures: 50,
            origin: 75,
          };
          const depth = milestones[id];
          if (depth && !fired.current.has(depth)) {
            fired.current.add(depth);
            trackProductEventOnce(`landing_scroll_depth_${depth}`);
          }
        });
      },
      { threshold: 0.35 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function LandingUnlockedSections() {
  useLandingScrollDepth();

  return (
    <>
      <div className="landing-upload-cta-bar">
        <LandingUploadCta variant="primary" source="landing_top" />
      </div>
      <LandingRevealSection />
      <div data-landing-section="failures">
        <LandingSixFailuresGrid />
      </div>
      <div data-landing-section="origin">
        <LandingOriginStory />
      </div>
      <LandingHowItsBuiltSection />
      <LandingAntidoteSection />
      <LandingFinalCta />
    </>
  );
}
