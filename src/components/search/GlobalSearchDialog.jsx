import { useNavigate } from 'react-router-dom';
import { Map, BookOpen, Layers } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const TYPE_ICONS = { journey: Map, module: BookOpen, card: Layers };
const TYPE_LABELS = { journey: 'Journeys', module: 'Modules', card: 'Cards' };

function HighlightedLabel({ label, matchStart, matchEnd }) {
  if (matchStart < 0 || matchEnd <= matchStart) {
    return <span className="gs-item-label">{label}</span>;
  }
  return (
    <span className="gs-item-label">
      {label.slice(0, matchStart)}
      <mark className="gs-highlight">{label.slice(matchStart, matchEnd)}</mark>
      {label.slice(matchEnd)}
    </span>
  );
}

function ResultGroup({ type, items, onSelect }) {
  if (!items.length) return null;
  const Icon = TYPE_ICONS[type];
  return (
    <div className="gs-group">
      <div className="gs-group-heading">{TYPE_LABELS[type]}</div>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`gs-item gs-item--${type}`}
          onClick={() => onSelect(item)}
        >
          <Icon size={16} className="gs-item-icon" />
          <div className="gs-item-text">
            <HighlightedLabel
              label={item.label}
              matchStart={item.labelMatchStart}
              matchEnd={item.labelMatchEnd}
            />
            {item.sublabel && (
              <span className="gs-item-sub">{item.sublabel}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function GlobalSearchDialog() {
  const navigate = useNavigate();
  const { open, setOpen, query, setQuery, results } = useGlobalSearch();

  const handleSelect = (item) => {
    setOpen(false);
    setQuery('');
    navigate(item.href);
  };

  if (!open) return null;

  const hasResults = results.journeys.length || results.modules.length || results.cards.length;

  return (
    <div className="gs-overlay" onClick={() => setOpen(false)}>
      <div className="gs-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="gs-input-wrap">
          <input
            type="text"
            className="gs-input"
            placeholder="Search journeys, modules, cards…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
            }}
            autoFocus
          />
          <kbd className="gs-kbd">esc</kbd>
        </div>

        <div className="gs-results">
          {query.trim() && !hasResults && (
            <p className="gs-empty">No results found</p>
          )}
          <ResultGroup type="journey" items={results.journeys} onSelect={handleSelect} />
          <ResultGroup type="module" items={results.modules} onSelect={handleSelect} />
          <ResultGroup type="card" items={results.cards} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}
