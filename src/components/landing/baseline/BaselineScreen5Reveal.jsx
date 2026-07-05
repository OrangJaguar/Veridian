import { useEffect, useState } from 'react';
import { trackProductEvent } from '@/lib/analytics';
import LandingRevealContent from './LandingRevealContent';
import LandingUploadCta from '@/components/landing/unlocked/LandingUploadCta';
import { markBaselineRevealSeen } from '@/lib/baselineStorage';

const FLASH_FADE_MS = 900;

export default function BaselineScreen5Reveal({ outcome, reducedMotion, onComplete }) {
  const [flashClass, setFlashClass] = useState(
    outcome === 'passed' ? 'baseline-flash--pass' : 'baseline-flash--fail',
  );

  useEffect(() => {
    trackProductEvent('baseline_reveal_view', { outcome });
    if (!reducedMotion) {
      const flashEnd = window.setTimeout(() => setFlashClass(''), FLASH_FADE_MS);
      return () => window.clearTimeout(flashEnd);
    }
    return undefined;
  }, [outcome, reducedMotion]);

  const handleContinue = () => {
    markBaselineRevealSeen();
    trackProductEvent('baseline_reveal_continue', { outcome });
    onComplete?.();
  };

  return (
    <div className="baseline-reveal-wrap baseline-reveal-full">
      {!reducedMotion && flashClass && (
        <div className={`baseline-flash-overlay ${flashClass}`} aria-hidden="true" />
      )}
      <div className="baseline-reveal-full-content">
        <LandingRevealContent outcome={outcome} layout="stacked" />
      </div>
      <div className="baseline-reveal-full-actions">
        <button type="button" className="btn btn-primary baseline-cta" onClick={handleContinue}>
          Continue
        </button>
        <LandingUploadCta variant="secondary" source="baseline_reveal" />
      </div>
    </div>
  );
}
