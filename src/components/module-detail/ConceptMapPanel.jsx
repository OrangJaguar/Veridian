import { useState } from 'react';

export default function ConceptMapPanel({ knowledgeMap = [] }) {
  const [open, setOpen] = useState(false);
  const concepts = Array.isArray(knowledgeMap) ? knowledgeMap : [];

  return (
    <section className="module-panel">
      <button
        type="button"
        className="module-panel-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>Knowledge Map</span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="module-panel-body">
          {concepts.length === 0 ? (
            <p className="journeys-status">Knowledge map will populate as you study.</p>
          ) : (
            <ul className="module-concept-list">
              {concepts.map((c, i) => (
                <li key={c.id ?? i}>{c.name ?? c.label ?? String(c)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
