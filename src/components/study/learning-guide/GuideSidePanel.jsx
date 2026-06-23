import LatexRenderer from '@/components/shared/LatexRenderer';

export default function GuideSidePanel({ variant = 'terms', keyTerms = [], takeaways = [] }) {
  if (variant === 'terms') {
    if (!keyTerms.length) return null;
    return (
      <aside className="guide-side-panel guide-side-panel--terms" aria-label="Key terms and formulas">
        <h2 className="guide-side-panel-title">Key terms</h2>
        <dl className="guide-side-panel-terms">
          {keyTerms.map((item) => (
            <div key={item.term} className="guide-side-panel-term">
              <dt>{item.term}</dt>
              <dd><LatexRenderer text={item.definition} /></dd>
            </div>
          ))}
        </dl>
      </aside>
    );
  }

  if (!takeaways.length) return null;
  return (
    <aside className="guide-side-panel guide-side-panel--takeaways" aria-label="Section takeaways">
      <h2 className="guide-side-panel-title">Remember</h2>
      <ul className="guide-side-panel-list">
        {takeaways.map((item) => (
          <li key={item}><LatexRenderer text={item} /></li>
        ))}
      </ul>
    </aside>
  );
}
