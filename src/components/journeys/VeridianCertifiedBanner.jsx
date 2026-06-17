import { BadgeCheck } from 'lucide-react';
import { isVeridianCertifiedJourney } from '@/lib/veridianCertified';

export default function VeridianCertifiedBanner({ journey, className = '' }) {
  if (!isVeridianCertifiedJourney(journey)) return null;

  return (
    <div className={`veridian-certified-banner${className ? ` ${className}` : ''}`}>
      <BadgeCheck size={18} className="veridian-certified-banner-icon" aria-hidden />
      <div>
        <strong>Veridian Certified</strong>
        <p>Built and curated by the Veridian team for high-quality, structured study.</p>
      </div>
    </div>
  );
}
