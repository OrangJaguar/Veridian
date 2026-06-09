import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';

export default function JourneyLevelActions({ activities, modules, journeyId, journey }) {
  const stageBCount = modules.filter((m) => m.stage === 'B').length;
  const disabled = stageBCount < 2;
  const launchStudy = useLaunchStudy();

  const interleaved = activities.find((a) => a.type === 'interleavedReview');
  const challenge = activities.find((a) => a.type === 'journeyChallenge');

  const daysUntilExam = journey?.examDate
    ? Math.ceil((journey.examDate - Date.now()) / 86400000)
    : null;
  const showCram = daysUntilExam != null && daysUntilExam <= 7;

  const launch = (activity, extraSessionData = {}) => {
    launchStudy({
      journeyId,
      activity,
      moduleId: null,
      initialSessionData: extraSessionData,
    });
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
          onClick={() => launch(interleaved)}
        >
          Interleaved Review
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || !challenge}
          title={disabled ? 'Requires 2+ modules in Stage B' : undefined}
          onClick={() => launch(challenge)}
        >
          Journey Challenge
        </button>
        {showCram && challenge && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => launch(challenge, { cramMode: true })}
          >
            Cram Mode
          </button>
        )}
      </div>
      {disabled && (
        <p className="journey-level-actions-note">
          Journey-wide reviews unlock when 2+ modules reach Stage B.
        </p>
      )}
    </section>
  );
}
