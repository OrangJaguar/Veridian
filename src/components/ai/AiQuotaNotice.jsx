import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAiQuota } from '@/hooks/queries/useAiQuota';

const DISMISS_KEY = 'veridian_ai_quota_low_dismissed';

function formatResetTime(resetsAt) {
  if (!resetsAt) return 'midnight UTC';
  return new Date(resetsAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function AiQuotaNotice() {
  const { data: quota } = useAiQuota();
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && sessionStorage.getItem(DISMISS_KEY) !== '1',
  );

  if (!quota || quota.status !== 'low' || !visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return createPortal(
    <div className="home-context-toast ai-quota-toast" role="status">
      <div className="home-context-toast-bubble">
        <p className="home-context-toast-text">
          You&apos;re running low on daily AI generations (
          {quota.totalRemaining}
          {' '}
          left). Non-AI study still works — your limit resets around
          {' '}
          {formatResetTime(quota.resetsAt)}.
          {' '}
          <Link to="/settings" className="ai-quota-toast-link">View usage</Link>
        </p>
        <button
          type="button"
          className="home-context-toast-dismiss"
          onClick={dismiss}
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
