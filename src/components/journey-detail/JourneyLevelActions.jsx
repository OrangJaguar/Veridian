import { Lock } from 'lucide-react';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';

const ACTIVITY_COPY = {
  interleavedReview: {
    title: 'Interleaved Review',
    description: 'Mixed questions across modules to strengthen recall under pressure.',
  },
  journeyChallenge: {
    title: 'Journey Challenge',
    description: 'A full-length exam-style run across everything in this journey.',
  },
};

function JourneyWideCard({ title, description, locked, lockMessage, onLaunch, launchLabel, extra }) {
  return (
    <div className={`journey-wide-card${locked ? ' locked' : ''}`}>
      <div className="journey-wide-card-main">
        <h3 className="journey-wide-card-title">
          {locked && (
            <Lock className="journey-wide-lock-icon" size={15} strokeWidth={2} aria-hidden />
          )}
          {title}
        </h3>
        <p className="journey-wide-card-desc">{locked ? lockMessage : description}</p>
      </div>
      <div className="journey-wide-card-action">
        {extra}
        {!locked && onLaunch && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onLaunch}>
            {launchLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function JourneyLevelActions({ activities, modules, journeyId, journey }) {
  const stageBCount = modules.filter((m) => m.stage === 'B').length;
  const locked = stageBCount < 2;
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

  const lockMessage = 'Unlocks when 2+ modules reach Stage B';

  return (
    <section className="journey-level-actions detail-section-box">
      <h2 className="journey-detail-section-title">Journey-wide activities</h2>
      <div className="journey-wide-cards">
        <JourneyWideCard
          title={ACTIVITY_COPY.interleavedReview.title}
          description={ACTIVITY_COPY.interleavedReview.description}
          locked={locked || !interleaved}
          lockMessage={lockMessage}
          onLaunch={interleaved ? () => launch(interleaved) : undefined}
          launchLabel="Start Interleaved"
        />
        <JourneyWideCard
          title={ACTIVITY_COPY.journeyChallenge.title}
          description={ACTIVITY_COPY.journeyChallenge.description}
          locked={locked || !challenge}
          lockMessage={lockMessage}
          onLaunch={challenge ? () => launch(challenge) : undefined}
          launchLabel="Start Challenge"
          extra={showCram && challenge && !locked && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => launch(challenge, { cramMode: true })}
            >
              Cram Mode
            </button>
          )}
        />
      </div>
    </section>
  );
}
