/** Abstract section art — lightweight SVG, alternates by index. No external assets. */

const ART = [
  // Network / concepts
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <circle cx="100" cy="80" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <circle cx="44" cy="48" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="156" cy="48" r="14" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="52" cy="122" r="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <circle cx="148" cy="118" r="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <line x1="100" y1="80" x2="44" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <line x1="100" y1="80" x2="156" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <line x1="100" y1="80" x2="52" y2="122" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <line x1="100" y1="80" x2="148" y2="118" stroke="currentColor" strokeWidth="1" opacity="0.35" />
    </svg>
  ),
  // Timeline
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <line x1="36" y1="120" x2="164" y2="120" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="52" cy="120" r="6" fill="currentColor" opacity="0.85" />
      <circle cx="100" cy="120" r="6" fill="currentColor" opacity="0.55" />
      <circle cx="148" cy="120" r="6" fill="currentColor" opacity="0.35" />
      <rect x="40" y="52" width="72" height="44" rx="6" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <rect x="108" y="36" width="56" height="56" rx="6" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
    </svg>
  ),
  // Growth curve
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <path d="M 28 128 Q 60 128 72 96 T 120 72 T 172 36" stroke="currentColor" strokeWidth="2" opacity="0.75" />
      <circle cx="172" cy="36" r="5" fill="currentColor" opacity="0.9" />
      <line x1="28" y1="128" x2="172" y2="128" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <line x1="28" y1="128" x2="28" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.25" />
    </svg>
  ),
  // Layers
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <rect x="48" y="100" width="104" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <rect x="56" y="72" width="88" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
      <rect x="64" y="44" width="72" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.75" />
      <rect x="72" y="16" width="56" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.95" />
    </svg>
  ),
  // Balance / ethics
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <line x1="100" y1="36" x2="100" y2="124" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="52" y1="64" x2="148" y2="64" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <path d="M 52 64 L 36 96 L 68 96 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <path d="M 148 64 L 132 96 L 164 96 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.45" />
      <line x1="72" y1="124" x2="128" y2="124" stroke="currentColor" strokeWidth="2" opacity="0.6" />
    </svg>
  ),
  // Spark / insight
  ({ className }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" aria-hidden="true">
      <path d="M 100 24 L 108 68 L 152 76 L 108 84 L 100 128 L 92 84 L 48 76 L 92 68 Z" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
      <circle cx="100" cy="76" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  ),
];

export default function GuideIllustration({ index = 0 }) {
  const Art = ART[index % ART.length];
  return (
    <div className="guide-illustration-wrap" aria-hidden="true">
      <Art className="guide-illustration-svg" />
    </div>
  );
}
