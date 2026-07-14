import { REVEAL_COPY } from './baselineContent';
import LandingFluencyDiagram from '@/components/landing/unlocked/LandingFluencyDiagram';

function RevealBody({ segments }) {
  return (
    <p className="landing-reveal-body">
      {segments.map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

export default function LandingRevealContent({ outcome, layout = 'split' }) {
  const copy = REVEAL_COPY[outcome] ?? REVEAL_COPY.failed;

  const copyBlock = (
    <>
      <h2 className="landing-reveal-title">{copy.header}</h2>
      <RevealBody segments={copy.body} />
    </>
  );

  if (layout === 'split') {
    return (
      <div className="landing-reveal-section landing-reveal-split">
        <div className="landing-reveal-copy">{copyBlock}</div>
        <LandingFluencyDiagram outcome={outcome} />
      </div>
    );
  }

  return (
    <div className="landing-reveal-section landing-reveal-stacked">
      {copyBlock}
      <LandingFluencyDiagram outcome={outcome} />
    </div>
  );
}
