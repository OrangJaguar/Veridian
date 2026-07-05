import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { updatePreferences } from '@/api/entities/preferences';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query-keys';
import { useAuth } from '@/hooks/useAuth';

export default function MaiSurveyPromptModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleDismiss = async () => {
    await updatePreferences({ maiSurveyPromptDismissedAt: Date.now() });
    queryClient.invalidateQueries({ queryKey: queryKeys.preferences(user?.email) });
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="create-welcome-modal-overlay" />
        <Dialog.Content className="create-welcome-modal mai-survey-prompt-modal">
          <Dialog.Title className="create-welcome-modal-title">Quick study check-in</Dialog.Title>
          <Dialog.Description className="create-welcome-modal-body">
            You&apos;ve been using Veridian for a few days. A 5-question survey helps us improve how we detect learning gaps — completely optional.
          </Dialog.Description>
          <div className="create-welcome-modal-actions">
            <Link to="/mai-survey?instance=onboarding" className="btn btn-primary" onClick={onClose}>
              Take survey
            </Link>
            <button type="button" className="btn btn-secondary" onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
