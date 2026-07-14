import { useState, useEffect } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { ensureJourneyWideActivities } from '@/api/entities/ensureJourneyActivities';
import JourneyChallengeSetupModal from '@/components/study/quiz/JourneyChallengeSetupModal';
import CramSessionSetupModal from '@/components/study/cram/CramSessionSetupModal';
import ActivityLabelWithTooltip from '@/components/study/ActivityLabelWithTooltip';
import {
  journeyWideActivitiesUnlocked,
  journeyUnlockProgress,
} from '@/utils/study/journeyUnlock';

const ACTIVITY_COPY = {
  journeyChallenge: {
    title: 'Journey Challenge',
    description: 'Timed exam-style check across the journey. Measures readiness.',
  },
  cramSession: {
    title: 'Cram Session',
    description: 'Short timed sprint on weak modules. Prep, not a full mock exam.',
  },
};

function JourneyWideCard({ title, description, activityType, locked, lockMessage, progress, onLaunch, launchLabel }) {
  return (
    <div className={`journey-wide-card${locked ? ' locked' : ''}`}>
      <div className="journey-wide-card-main">
        <h3 className="journey-wide-card-title">
          {locked && (
            <Lock className="journey-wide-lock-icon" size={15} strokeWidth={2} aria-hidden />
          )}
          {activityType ? (
            <ActivityLabelWithTooltip activityType={activityType} label={title} />
          ) : (
            title
          )}
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

function LockedJourneyWideCallout({ progress, expanded, onToggle }) {
  return (
    <div className="journey-wide-later-callout">
      <div className="journey-wide-later-main">
        <h3 className="journey-wide-later-title">Later: Journey Challenge &amp; Cram Session</h3>
        <p className="journey-wide-later-body">
          Unlocked when half your modules reach Stage B. Challenge measures readiness; Cram is a
          short weak-module prep sprint.
        </p>
        {progress && (
          <p className="journey-unlock-progress">
            {progress.ready}/{progress.required} modules at Stage B
          </p>
        )}
      </div>
      <button
        type="button"
        className="journey-wide-later-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide details' : 'Show details'}
        <ChevronDown
          size={16}
          className={`failure-profile-explainer-chevron${expanded ? ' expanded' : ''}`}
          aria-hidden
        />
      </button>
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const showCards = !locked || detailsOpen;

  return (
    <section className="journey-level-actions detail-section-box">
      <h2 className="journey-detail-section-title">Journey-wide activities</h2>

      {locked && (
        <LockedJourneyWideCallout
          progress={progress}
          expanded={detailsOpen}
          onToggle={() => setDetailsOpen((v) => !v)}
        />
      )}

      {showCards && (
        <div className="journey-wide-cards">
          <JourneyWideCard
            title={ACTIVITY_COPY.journeyChallenge.title}
            activityType="journeyChallenge"
            description={ACTIVITY_COPY.journeyChallenge.description}
            locked={locked || !challenge}
            lockMessage={lockMessage}
            progress={progress}
            onLaunch={challenge ? () => setChallengeModalOpen(true) : undefined}
            launchLabel="Start Challenge"
          />
          <JourneyWideCard
            title={ACTIVITY_COPY.cramSession.title}
            activityType="cramSession"
            description={ACTIVITY_COPY.cramSession.description}
            locked={locked || !cram}
            lockMessage={lockMessage}
            progress={progress}
            onLaunch={cram ? () => setCramModalOpen(true) : undefined}
            launchLabel="Start Cram"
          />
        </div>
      )}

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
