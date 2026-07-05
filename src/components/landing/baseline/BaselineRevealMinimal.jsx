import { REVEAL_COPY } from './baselineContent';

export default function BaselineRevealMinimal({ outcome }) {
  const copy = outcome === 'passed' ? REVEAL_COPY.passed : REVEAL_COPY.failed;

  return (
    <div className="baseline-reveal-minimal">
      <div className="baseline-reveal-minimal-glow" aria-hidden="true" />
      <h2 className="baseline-reveal-minimal-title">{copy.header}</h2>
    </div>
  );
}
