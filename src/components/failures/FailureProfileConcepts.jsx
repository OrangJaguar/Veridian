import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

export default function FailureProfileConcepts({ concepts = [] }) {
  if (!concepts.length) return null;

  return (
    <div className="failure-profile-concepts">
      <span className="failure-profile-concepts-label">Focus concepts</span>
      <div className="failure-profile-concept-chips">
        {concepts.map((c) => {
          const modeMeta = getFailureModeMeta(c.modeId);
          const modeClass = getFailureModeClassName(c.modeId);
          return (
            <span key={c.conceptId} className={`failure-concept-chip ${modeClass}`}>
              <span className="failure-concept-chip-label">{c.label}</span>
              {modeMeta && (
                <span className="failure-concept-chip-mode">{modeMeta.title}</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
