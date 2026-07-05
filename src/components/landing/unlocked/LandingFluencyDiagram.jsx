export default function LandingFluencyDiagram({ outcome = 'failed' }) {
  const passed = outcome === 'passed';

  return (
    <div className="landing-fluency-diagram" aria-hidden="true">
      <div className="landing-fluency-diagram-header">
        <span>Recognition</span>
        <span className="landing-fluency-diagram-gap-label">The gap exams test</span>
        <span>Recall</span>
      </div>

      <div className="landing-fluency-diagram-track">
        <div className="landing-fluency-diagram-node landing-fluency-diagram-node--left">
          <span className="landing-fluency-diagram-q">Q1</span>
          <p>&ldquo;When metal is scarce&hellip;&rdquo;</p>
          <span className="landing-fluency-diagram-match">Exact wording</span>
        </div>

        <div className={`landing-fluency-diagram-bridge${passed ? ' landing-fluency-diagram-bridge--passed' : ''}`}>
          <div className="landing-fluency-diagram-bridge-line" />
          {!passed && <span className="landing-fluency-diagram-break">✕</span>}
          {passed && <span className="landing-fluency-diagram-strain">strain</span>}
        </div>

        <div className="landing-fluency-diagram-node landing-fluency-diagram-node--right">
          <span className="landing-fluency-diagram-q">Q2</span>
          <p>&ldquo;Iron mines depleted&hellip;&rdquo;</p>
          <span className="landing-fluency-diagram-shift">New wording</span>
        </div>
      </div>

      <div className="landing-fluency-diagram-chain">
        <span className="landing-fluency-diagram-chain-label">Translation chain</span>
        <div className="landing-fluency-diagram-steps">
          <span>iron</span>
          <span aria-hidden="true">→</span>
          <span>metal</span>
          <span aria-hidden="true">→</span>
          <span>centralize</span>
          <span aria-hidden="true">→</span>
          <span>consolidate</span>
          <span aria-hidden="true">→</span>
          <span>armed forces</span>
        </div>
      </div>
    </div>
  );
}
