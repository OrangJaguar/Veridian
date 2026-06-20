import { Calculator, MoreVertical, Pencil, SquareFunction } from 'lucide-react';

const UTILITIES = [
  { id: 'highlights', label: 'Highlights & Notes', Icon: Pencil },
  { id: 'calculator', label: 'Calculator', Icon: Calculator },
  { id: 'reference', label: 'Reference', Icon: SquareFunction },
  { id: 'more', label: 'More', Icon: MoreVertical },
];

export default function ApClassroomHeader({ title, onExit }) {
  const handleUtility = () => {
    // Placeholder — visual fidelity only in v1
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
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="ap-classroom-utility-label">{label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
