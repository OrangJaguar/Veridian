import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const MAX_HINTS = 3;

export default function FreeRecallHintModal({
  open,
  hints,
  preloading,
  generating = false,
  onClose,
  onGenerateNext,
}) {
  if (!open) return null;

  const tier = hints.length;
  const title = `Hint ${Math.min(tier + 1, MAX_HINTS)}/${MAX_HINTS}`;
  const canGenerate = tier < MAX_HINTS;
  const waitingForPreload = canGenerate && preloading && tier >= hints.length && !generating;
  const busy = generating || waitingForPreload;

  return createPortal(
    <div className="study-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="study-modal free-recall-hint-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="free-recall-hint-title"
      >
        <div className="study-modal-header">
          <h2 id="free-recall-hint-title" className="study-modal-title">{title}</h2>
          <button type="button" className="study-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="study-modal-body free-recall-hint-body">
          {tier === 0 ? (
            <p className="free-recall-hint-intro">
              Stuck? You can request up to three progressive hints. Each hint builds on the last — starting broad, then key terms, then a light framework.
            </p>
          ) : (
            <div className="free-recall-hint-list">
              {hints.map((h) => (
                <div key={h.tier} className="free-recall-hint-item">
                  <span className="free-recall-hint-tier-label">Hint {h.tier}</span>
                  <p>{h.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="free-recall-hint-actions">
            {canGenerate && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onGenerateNext}
                disabled={busy}
              >
                {generating
                  ? 'Generating hint…'
                  : waitingForPreload
                    ? 'Preparing hints…'
                    : tier === 0
                      ? 'Get first hint'
                      : 'Show next hint'}
              </button>
            )}
            {tier >= MAX_HINTS && (
              <p className="free-recall-hint-max">All hints used — finish your recall when ready.</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
