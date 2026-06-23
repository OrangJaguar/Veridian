import { Calculator, MoreVertical } from 'lucide-react';

function HighlightsNotesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="ap-classroom-custom-icon">
      <path
        d="M14 3H6a1 1 0 0 0-1 1v16l5-2.5L15 20V4a1 1 0 0 0-1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M17 6l3 3M20 6l-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M8 8h4M8 11h4M8 14h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ReferenceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="ap-classroom-custom-icon">
      <rect x="4" y="3" width="16" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 3v18" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const UTILITIES = [
  { id: 'highlights', label: 'Highlights & Notes', Icon: HighlightsNotesIcon },
  { id: 'calculator', label: 'Calculator', Icon: Calculator },
  { id: 'reference', label: 'Reference', Icon: ReferenceIcon },
  { id: 'more', label: 'More', Icon: MoreVertical },
];

export default function ApClassroomHeader({ title, onExit }) {
  const handleUtility = () => {
    // Placeholder — visual fidelity only
  };

  return (
    <header className="ap-classroom-header">
      <div className="ap-classroom-header-left">
        {onExit && (
          <button type="button" className="ap-classroom-exit" onClick={onExit}>
            Exit
          </button>
        )}
        <h1 className="ap-classroom-title">{title}</h1>
      </div>

      <div className="ap-classroom-utilities">
        {UTILITIES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="ap-classroom-utility-btn"
            onClick={handleUtility}
            aria-label={label}
            title="Coming soon"
          >
            <span className="ap-classroom-utility-icon">
              {id === 'calculator' || id === 'more' ? (
                <Icon size={20} strokeWidth={1.75} />
              ) : (
                <Icon />
              )}
            </span>
            <span className="ap-classroom-utility-label">{label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
