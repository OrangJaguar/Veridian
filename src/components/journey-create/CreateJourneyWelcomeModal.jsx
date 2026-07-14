import * as Dialog from '@radix-ui/react-dialog';

export default function CreateJourneyWelcomeModal({ open, onBuild, onSkip, onBrowseLibrary }) {
  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="create-welcome-modal-overlay" />
        <Dialog.Content className="create-welcome-modal" aria-describedby="create-welcome-desc">
          <Dialog.Title className="create-welcome-modal-title">
            Let us build your study engine.
          </Dialog.Title>
          <Dialog.Description id="create-welcome-desc" className="create-welcome-modal-body">
            We don&apos;t do empty dashboards. Give us your hardest upcoming test topic, paste your notes, or drop in your syllabus, and our engine will build your targeted study plan.
          </Dialog.Description>
          <div className="create-welcome-modal-actions">
            <button type="button" className="btn btn-primary" onClick={onBuild}>
              Let&apos;s Build It
            </button>
            {onBrowseLibrary && (
              <button type="button" className="btn btn-secondary" onClick={onBrowseLibrary}>
                Browse a ready-made journey
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onSkip}>
              Skip for now
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
