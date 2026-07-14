import { useEffect, useState, useCallback } from 'react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { getBaselineUnlocked } from '@/lib/baselineStorage';
import { useLandingChrome } from '@/contexts/LandingChromeContext';
import LandingScrollProgress from '@/components/landing/LandingScrollProgress';
import BaselineFlow from '@/components/landing/baseline/BaselineFlow';
import LandingUnlockedSections from '@/components/landing/unlocked/LandingUnlockedSections';

export default function LandingPage() {
  const [unlocked, setUnlocked] = useState(() => getBaselineUnlocked());
  const { setBaselineLocked } = useLandingChrome() ?? {};

  usePageMeta({
    description: 'Veridian shows you why studying hasn\'t been working — then tells you exactly what to do tonight. Free study engine with real diagnostics, spaced repetition, and Due Today planning.',
    canonicalPath: '/',
  });

  useEffect(() => {
    setBaselineLocked?.(!unlocked);
    return () => setBaselineLocked?.(false);
  }, [unlocked, setBaselineLocked]);

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
    setBaselineLocked?.(false);
  }, [setBaselineLocked]);

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Veridian',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Study engine that detects six learning breakdown patterns, adapts practice to your gaps, and plans Due Today from your own material.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      {unlocked && <LandingScrollProgress />}
      <div className={`landing-page${unlocked ? ' landing-page--unlocked' : ' landing-page--locked'}`}>
        {!unlocked && <BaselineFlow onUnlocked={handleUnlocked} />}
        {unlocked && <LandingUnlockedSections />}
      </div>
    </>
  );
}
