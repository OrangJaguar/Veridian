import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { MIN_MODULES_TO_PUBLISH, MIN_TAGS_TO_PUBLISH } from '@/lib/library/libraryTags';

export default function PublishJourneyModal({
  open,
  mode,
  eligibility,
  tagCount,
  saving,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  const requirements = [
    {
      key: 'modules',
      met: eligibility?.modulesOk,
      label: `${MIN_MODULES_TO_PUBLISH}+ modules (${eligibility?.moduleCount ?? '…'})`,
    },
    {
      key: 'activities',
      met: eligibility?.activitiesOk,
      label: 'Activities scaffolded per module',
    },
    {
      key: 'tags',
      met: eligibility?.tagsOk,
      label: `${MIN_TAGS_TO_PUBLISH}+ tag${MIN_TAGS_TO_PUBLISH === 1 ? '' : 's'} selected (${tagCount})`,
    },
  ];

  const canPublish = eligibility?.canPublish;

  return createPortal(
    <div className="study-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="study-modal publish-journey-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="publish-modal-title"
      >
        <div className="study-modal-header">
          <h2 id="publish-modal-title" className="study-modal-title">
            {mode === 'confirm' ? 'Make journey public?' : 'Publish requirements'}
          </h2>
          <button type="button" className="study-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="study-modal-body">
          {mode === 'confirm' ? (
            <p className="publish-modal-lead">
              Your journey will appear in the Community Library. Other students can preview and
              clone it — your study progress stays private.
            </p>
          ) : (
            <>
              <p className="publish-modal-lead">
                Finish these requirements before publishing to the Community Library.
              </p>
              <ul className="publish-req-list">
                {requirements.map((req) => (
                  <li key={req.key} className={req.met ? 'met' : 'unmet'}>
                    <span className="publish-req-icon" aria-hidden="true">
                      {req.met ? <Check size={14} strokeWidth={2.5} /> : null}
                    </span>
                    {req.label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="study-modal-footer publish-modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          {mode === 'confirm' && canPublish && (
            <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={saving}>
              {saving ? 'Publishing…' : 'Make public'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
