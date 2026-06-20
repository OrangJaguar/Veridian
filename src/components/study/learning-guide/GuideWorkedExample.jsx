import LatexRenderer from '@/components/shared/LatexRenderer';

function highlightClass(activeKey, key) {
  return activeKey === key ? ' guide-speak-active' : '';
}

function blockProps(onSegmentClick, key) {
  if (!onSegmentClick) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onSegmentClick(key),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSegmentClick(key);
      }
    },
  };
}

export default function GuideWorkedExample({
  example,
  exampleIndex,
  activeKey,
  onSegmentClick,
}) {
  if (!example) return null;

  const base = `ex-${exampleIndex}`;
  const cardActive = [
    `${base}-scenario`,
    ...example.steps.map((_, si) => `${base}-step-${si}`),
    `${base}-answer`,
    `${base}-reasoning`,
  ].includes(activeKey);

  return (
    <section className={`guide-example-card${cardActive ? ' guide-speak-active' : ''}`}>
      <span className="guide-example-label">Worked example — let&apos;s solve it together</span>
      <p className="guide-example-intro">
        We&apos;ll break this down step by step. Follow each part before moving on.
      </p>
      <div
        className={`guide-example-problem${onSegmentClick ? ' guide-sentence--clickable' : ''}${highlightClass(activeKey, `${base}-scenario`)}`}
        {...blockProps(onSegmentClick, `${base}-scenario`)}
      >
        <span className="guide-example-problem-label">The problem</span>
        <p className="guide-example-scenario"><LatexRenderer text={example.scenario} /></p>
      </div>
      <ol className="guide-example-steps">
        {example.steps.map((step, stepIdx) => (
          <li
            key={step}
            className={`${highlightClass(activeKey, `${base}-step-${stepIdx}`)}${onSegmentClick ? ' guide-sentence--clickable' : ''}`.trim()}
            {...blockProps(onSegmentClick, `${base}-step-${stepIdx}`)}
          >
            <span className="guide-example-step-num">Step {stepIdx + 1}</span>
            <LatexRenderer text={step} />
          </li>
        ))}
      </ol>
      <div
        className={`guide-example-takeaway${onSegmentClick ? ' guide-sentence--clickable' : ''}${highlightClass(activeKey, `${base}-answer`)}`}
        {...blockProps(onSegmentClick, `${base}-answer`)}
      >
        <span className="guide-example-takeaway-label">What we found</span>
        <p><LatexRenderer text={example.answer} /></p>
      </div>
      <p
        className={`guide-example-reasoning${onSegmentClick ? ' guide-sentence--clickable' : ''}${highlightClass(activeKey, `${base}-reasoning`)}`}
        {...blockProps(onSegmentClick, `${base}-reasoning`)}
      >
        <strong>Why this works: </strong>
        <LatexRenderer text={example.reasoning} />
      </p>
    </section>
  );
}
