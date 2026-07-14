import { Link } from 'react-router-dom';
import { useAiQuota } from '@/hooks/queries/useAiQuota';

function formatResetTime(resetsAt) {
  if (!resetsAt) return 'midnight UTC';
  return new Date(resetsAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function SettingsAiQuotaSection() {
  const { data: quota, isPending, isError } = useAiQuota();

  return (
    <section className="settings-section detail-section-box">
      <h2 className="settings-section-title">Daily AI usage</h2>
      <p className="settings-section-lead">
        Veridian is free — daily limits keep AI costs sustainable for everyone.
        Limits are counted by generation type (quizzes, guides, flashcards, etc.).
        A token budget on our side prevents runaway usage without affecting what you see here.
      </p>

      {isPending && !quota ? (
        <p className="settings-muted">Loading usage…</p>
      ) : null}
      {isError ? (
        <p className="settings-muted">Could not load AI usage right now.</p>
      ) : null}

      {quota ? (
        <>
          <div className="ai-quota-summary">
            <span className="ai-quota-summary-count">
              {quota.totalRemaining}
              {' '}
              of
              {' '}
              {quota.totalLimit}
              {' '}
              AI generations left today
            </span>
            <span className="ai-quota-summary-reset">
              Resets
              {' '}
              {formatResetTime(quota.resetsAt)}
            </span>
          </div>

          <ul className="ai-quota-category-list">
            {(quota.categories ?? []).map((cat) => (
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

          {quota.status === 'exhausted' ? (
            <p className="ai-quota-exhausted-note">
              You&apos;ve hit today&apos;s AI limit. Study with existing materials or come back after reset.
            </p>
          ) : null}
        </>
      ) : null}

      <p className="settings-muted ai-quota-footnote">
        Need more detail?
        {' '}
        <Link to="/ai-limit">Open the AI limit page</Link>
      </p>
    </section>
  );
}
