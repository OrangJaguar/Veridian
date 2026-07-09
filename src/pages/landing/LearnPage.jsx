import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import LandingSixFailuresGrid from '@/components/landing/unlocked/LandingSixFailuresGrid';
import LandingHowItsBuiltSection from '@/components/landing/unlocked/LandingHowItsBuiltSection';
import LandingOriginStory from '@/components/landing/unlocked/LandingOriginStory';
import LandingFinalCta from '@/components/landing/unlocked/LandingFinalCta';
import LandingUploadCta from '@/components/landing/unlocked/LandingUploadCta';

export default function LearnPage() {
  usePageMeta({
    description: 'Veridian diagnoses how your knowledge actually breaks down — recognition vs recall, transfer failures, exam pressure — then builds a daily study plan from your own material.',
    canonicalPath: '/learn',
  });

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Veridian',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Study engine with fluency diagnostics, spaced repetition, and Due Today planning.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <div className="landing-page landing-page--unlocked learn-page">
        <section className="learn-page-hero">
          <h1>Your brain lies about how much you know. Veridian proves it — then fixes it.</h1>
          <p>
            A study engine that diagnoses where your knowledge breaks down, trains retrieval under pressure,
            and tells you exactly what to do tonight. Upload your notes or type a topic — we build the rest.
          </p>
          <div className="learn-page-cta-row">
            <Link to="/" className="btn btn-primary">
              Take the 30-second baseline
            </Link>
            <LandingUploadCta variant="secondary" source="learn_page" className="learn-page-upload-cta" />
          </div>
        </section>
        <LandingSixFailuresGrid />
        <LandingHowItsBuiltSection />
        <LandingOriginStory />
        <LandingFinalCta />
      </div>
    </>
  );
}
