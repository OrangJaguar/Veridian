import { Link } from 'react-router-dom';
import { useAiQuota } from '@/hooks/queries/useAiQuota';
import VeridianLoading from '@/components/shared/VeridianLoading';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import { useAuth } from '@/hooks/useAuth';

function formatResetTime(resetsAt) {
  if (!resetsAt) return 'midnight UTC';
  return new Date(resetsAt).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function AiLimitPage() {
  const { isAuthenticated } = useAuth();
  const { data: quota, isPending } = useAiQuota();

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Daily AI limit</h1>
        <LoginPrompt action="view your AI usage" />
      </div>
    );
  }

  if (isPending && !quota) {
    return <VeridianLoading fullPage />;
  }

  const exhausted = quota?.status === 'exhausted';

  return (
    <div className="ai-limit-page">
      <header className="ai-limit-header">
        <h1 className="ai-limit-title">
          {exhausted ? 'Daily AI limit reached' : 'Daily AI usage'}
        </h1>
        <p className="ai-limit-lead">
          {exhausted
            ? 'You\'ve used all of your AI generations for today. Flashcards, quizzes, and guides you\'ve already created still work — only new AI generation is paused until reset.'
            : 'Track how much AI generation you have left today. Veridian stays free; limits keep usage fair for everyone.'}
        </p>
      </header>

      {quota ? (
        <section className="detail-section-box ai-limit-panel">
          <div className="ai-quota-summary ai-quota-summary--prominent">
            <span className="ai-quota-summary-count">
              {quota.totalRemaining}
              {' '}
              of
              {' '}
              {quota.totalLimit}
              {' '}
              generations remaining
            </span>
            <span className="ai-quota-summary-reset">
              Resets
              {' '}
              {formatResetTime(quota.resetsAt)}
            </span>
          </div>

          <ul className="ai-quota-category-list">
            {quota.categories.map((cat) => (
              <li key={cat.key} className="ai-quota-category-item">
                <div className="ai-quota-category-head">
                  <span>{cat.label}</span>
                  <span className="ai-quota-category-count">
                    {cat.remaining}
                    /
                    {cat.limit}
                  </span>
                </div>
                <div className="ai-quota-category-bar" aria-hidden="true">
                  <div
                    className="ai-quota-category-fill"
                    style={{ width: `${Math.max(0, 100 - cat.percentRemaining)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="ai-limit-actions">
        <Link to="/home" className="btn btn-primary">Back to home</Link>
        <Link to="/settings" className="btn btn-secondary">Settings</Link>
      </div>
    </div>
  );
}
