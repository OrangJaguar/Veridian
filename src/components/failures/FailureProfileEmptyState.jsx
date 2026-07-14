import { formatEmptyStateTier } from '@/utils/failures/formatFailureCopy';

export default function FailureProfileEmptyState({ evidenceSessionCount = 0, hasEmerging = false, showGhostBars = false }) {
  const state = formatEmptyStateTier({ evidenceSessionCount, hasEmerging });
  if (!state) return null;

  return (
    <div className={`failure-profile-empty-state failure-profile-empty-state--${state.tier}`}>
      <p className="failure-profile-empty-title">{state.title}</p>
      <p className="failure-profile-empty">{state.body}</p>
      {showGhostBars && state.tier === 'warming' && (
        <div className="failure-profile-skeleton-bars" aria-hidden="true">
          <div className="failure-profile-skeleton-bar" />
          <div className="failure-profile-skeleton-bar failure-profile-skeleton-bar--short" />
          <div className="failure-profile-skeleton-bar failure-profile-skeleton-bar--shorter" />
        </div>
      )}
    </div>
  );
}
