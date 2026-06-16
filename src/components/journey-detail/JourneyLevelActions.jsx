import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { ensureJourneyWideActivities } from '@/api/entities/ensureJourneyActivities';
import JourneyChallengeSetupModal from '@/components/study/quiz/JourneyChallengeSetupModal';
import CramSessionSetupModal from '@/components/study/cram/CramSessionSetupModal';
import {
  journeyWideActivitiesUnlocked,
  journeyUnlockProgress,
} from '@/utils/study/journeyUnlock';

const ACTIVITY_COPY = {
  journeyChallenge: {
    title: 'Journey Challenge',
    description: 'A strict timed exam-style run across your whole journey.',
  },
  cramSession: {
    title: 'Cram Session',
    description: 'Fast time-boxed review on your weakest modules.',
  },
};

function JourneyWideCard({ title, description, locked, lockMessage, progress, onLaunch, launchLabel }) {
  return (
    <div className={`journey-wide-card${locked ? ' locked' : ''}`}>
      <div className="journey-wide-card-main">
        <h3 className="journey-wide-card-title">
          {locked && (
            <Lock className="journey-wide-lock-icon" size={15} strokeWidth={2} aria-hidden />
          )}
          {title}
        </h3>
        <p className="journey-wide-card-desc">
          {locked ? lockMessage : description}
        </p>
        {locked && progress && (
          <p className="journey-unlock-progress">
            {progress.ready}/{progress.required} modules at Stage B
          </p>
        )}
      </div>
      <div className="journey-wide-card-action">
        {!locked && onLaunch && (
          <button type="button" className="btn btn-primary btn-sm" onClick={onLaunch}>
            {launchLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function JourneyLevelActions({ activities: activitiesProp, modules, journeyId, journey }) {
  const { data: activities = activitiesProp ?? [], refetch } = useActivitiesByJourney(journeyId);
  const locked = !journeyWideActivitiesUnlocked(modules);
  const progress = journeyUnlockProgress(modules);
  const launchStudy = useLaunchStudy();

  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [cramModalOpen, setCramModalOpen] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!journeyId || !activities.length) return;
    const hasCram = activities.some((a) => a.type === 'cramSession');
    if (!hasCram) {
      ensureJourneyWideActivities(journeyId, activities).then(() => refetch());
    }
  }, [journeyId, activities, refetch]);

  const challenge = activities.find((a) => a.type === 'journeyChallenge');
  const cram = activities.find((a) => a.type === 'cramSession');

  const lockMessage = 'Unlocks when half your modules reach Stage B';

  const launchWithConfig = async (activity, initialSessionData) => {
    setLaunching(true);
    try {
      await launchStudy({
        journeyId,
        activity,
        moduleId: null,
        initialSessionData,
      });
    } finally {
      setLaunching(false);
      setChallengeModalOpen(false);
      setCramModalOpen(false);
    }
  };

  return (
    <section className="journey-level-actions detail-section-box">
      <h2 className="journey-detail-section-title">Journey-wide activities</h2>
      <div className="journey-wide-cards">
        <JourneyWideCard
          title={ACTIVITY_COPY.journeyChallenge.title}
          description={ACTIVITY_COPY.journeyChallenge.description}
          locked={locked || !challenge}
          lockMessage={lockMessage}
          progress={progress}
          onLaunch={challenge ? () => setChallengeModalOpen(true) : undefined}
          launchLabel="Start Challenge"
        />
        <JourneyWideCard
          title={ACTIVITY_COPY.cramSession.title}
          description={ACTIVITY_COPY.cramSession.description}
          locked={locked || !cram}
          lockMessage={lockMessage}
          progress={progress}
          onLaunch={cram ? () => setCramModalOpen(true) : undefined}
          launchLabel="Start Cram"
        />
      </div>

      {challengeModalOpen && challenge && (
        <JourneyChallengeSetupModal
          open
          modules={modules}
          activities={activities}
          journey={journey}
          loading={launching}
          onClose={() => setChallengeModalOpen(false)}
          onStart={(challengeConfig) => launchWithConfig(challenge, { challengeConfig })}
        />
      )}

      {cramModalOpen && cram && (
        <CramSessionSetupModal
          open
          modules={modules}
          activities={activities}
          journey={journey}
          loading={launching}
          onClose={() => setCramModalOpen(false)}
          onStart={(cramConfig) => launchWithConfig(cram, { cramConfig })}
        />
      )}
    </section>
  );
}
