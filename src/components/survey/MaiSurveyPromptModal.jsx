import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
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

  if (!open) return null;

  return createPortal(
    <div className="study-modal-overlay mai-survey-prompt-overlay" role="presentation">
      <div
        className="study-modal mai-survey-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mai-survey-prompt-title"
        aria-describedby="mai-survey-prompt-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mai-survey-prompt-badge">5 questions · ~2 min</span>
        <h2 id="mai-survey-prompt-title" className="mai-survey-prompt-title">
          Quick study check-in
        </h2>
        <p id="mai-survey-prompt-desc" className="mai-survey-prompt-body">
          You&apos;ve been using Veridian for a few days. This short survey helps us improve how we
          detect learning gaps — optional, but very helpful.
        </p>
        <div className="mai-survey-prompt-actions">
          <Link
            to="/mai-survey?instance=onboarding"
            className="btn btn-primary mai-survey-prompt-primary"
            onClick={onClose}
          >
            Take the survey
          </Link>
          <button type="button" className="btn btn-ghost mai-survey-prompt-dismiss" onClick={handleDismiss}>
            Not now
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
