import { useMemo } from 'react';
import { CONCEPT_STATUS } from '@/utils/study/buildConceptStatusBoard';

const STATUS_FILL = {
  [CONCEPT_STATUS.unseen]: 'var(--surface-hover, #eee)',
  [CONCEPT_STATUS.developing]: 'var(--text-muted)',
  [CONCEPT_STATUS.fragile]: '#c0392b',
  [CONCEPT_STATUS.solid]: 'var(--text-main)',
};

/**
 * Accessible SVG concept graph. Works with zero relations (nodes only).
 */
export default function ConceptRelationGraph({
  rows = [],
  relations = [],
  selectedId = null,
  onSelect,
}) {
  const layout = useMemo(() => layoutNodes(rows), [rows]);

  if (!rows.length) return null;

  const nodeById = Object.fromEntries(layout.map((n) => [n.conceptId, n]));
  const edges = (relations ?? []).filter(
    (r) => nodeById[r.fromConceptId] && nodeById[r.toConceptId],
  );

  const fragileIds = new Set(
    rows.filter((r) => r.status === CONCEPT_STATUS.fragile).map((r) => r.conceptId),
  );

  return (
    <div className="concept-graph-wrap">
      <svg
        className="concept-graph"
        viewBox="0 0 640 280"
        role="img"
        aria-label="Concept relationship graph"
      >
        {edges.map((edge) => {
          const from = nodeById[edge.fromConceptId];
          const to = nodeById[edge.toConceptId];
          const weak = fragileIds.has(edge.fromConceptId) || fragileIds.has(edge.toConceptId);
          return (
            <line
              key={`${edge.fromConceptId}-${edge.toConceptId}-${edge.type}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              className={`concept-graph-edge concept-graph-edge--${edge.type}${weak ? ' is-weak' : ''}`}
            />
          );
        })}
        {layout.map((node) => {
          const selected = selectedId === node.conceptId;
          return (
            <g key={node.conceptId}>
              <circle
                cx={node.x}
                cy={node.y}
                r={selected ? 18 : 14}
                fill={STATUS_FILL[node.status] ?? STATUS_FILL[CONCEPT_STATUS.unseen]}
                className={`concept-graph-node${selected ? ' is-selected' : ''}`}
                tabIndex={0}
                role="button"
                aria-label={`${node.term}, ${node.status}`}
                aria-pressed={selected}
                onClick={() => onSelect?.(node.conceptId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(node.conceptId);
                  }
                }}
              />
              <text
                x={node.x}
                y={node.y + 28}
                textAnchor="middle"
                className="concept-graph-label"
              >
                {truncate(node.term, 14)}
              </text>
            </g>
          );
        })}
      </svg>
      {!edges.length && (
        <p className="concept-graph-empty-note">
          Concept links appear when prerequisite or related edges are available.
        </p>
      )}
    </div>
  );
}

function truncate(text, max) {
  const value = String(text ?? '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function layoutNodes(rows) {
  const n = rows.length;
  if (!n) return [];
  const cx = 320;
  const cy = 130;
  const radius = Math.min(110, 40 + n * 8);
  return rows.map((row, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      ...row,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
}
