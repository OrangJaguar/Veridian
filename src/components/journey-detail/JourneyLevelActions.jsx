import { toast } from 'sonner';

export default function JourneyLevelActions({ activities, modules }) {
  const stageBCount = modules.filter((m) => m.stage === 'B').length;
  const disabled = stageBCount < 2;

  const interleaved = activities.find((a) => a.type === 'interleavedReview');
  const challenge = activities.find((a) => a.type === 'journeyChallenge');

  const launch = (label) => {
    toast.info(`${label} launches in Phase 6`);
  };

  return (
    <section className="journey-level-actions">
      <h2 className="journey-detail-section-title">Journey-wide activities</h2>
      <div className="journey-level-actions-row">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !interleaved}
          title={disabled ? 'Requires 2+ modules in Stage B' : undefined}
          onClick={() => launch('Interleaved Review')}
        >
          Interleaved Review
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !challenge}
          title={disabled ? 'Requires 2+ modules in Stage B' : undefined}
          onClick={() => launch('Journey Challenge')}
        >
          Journey Challenge
        </button>
      </div>
      {disabled && (
        <p className="journey-level-actions-note">
          Journey-wide reviews unlock when 2+ modules reach Stage B.
        </p>
      )}
    </section>
  );
}
