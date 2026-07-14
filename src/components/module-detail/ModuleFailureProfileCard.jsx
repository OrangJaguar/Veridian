import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useModulePrescription } from '@/hooks/queries/useModulePrescription';
import { useDueToday } from '@/hooks/queries/useDueToday';
import { useLaunchDueItem } from '@/hooks/home/useLaunchDueItem';
import FailureModeIcon from '@/components/failures/FailureModeIcon';
import FailureProfileRankedModes from '@/components/failures/FailureProfileRankedModes';
import FailureProfileConcepts from '@/components/failures/FailureProfileConcepts';
import FailureProfilePrescriptionPreview from '@/components/failures/FailureProfilePrescriptionPreview';
import FailureProfileEmptyState from '@/components/failures/FailureProfileEmptyState';
import FailureProfileTrendBadge from '@/components/failures/FailureProfileTrendBadge';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import { buildLandingFailuresContent } from '@/utils/failures/buildLandingFailuresContent';
import {
  formatEvidenceCount,
  formatSecondaryModeLine,
  formatFirstEmergingToast,
} from '@/utils/failures/formatFailureCopy';
import { maybeFirstEmergingToast } from '@/utils/failures/firstEmergingToast';
import { resolveTonightPrescriptionLaunch } from '@/utils/failures/resolveTonightPrescriptionLaunch';
import { getFailureModeClassName } from '@/utils/failures/failureModeVisuals';

function ModuleFailureProfileSkeleton() {
  return (
    <div className="failure-profile-skeleton" aria-busy="true" aria-label="Loading learning profile">
      <div className="failure-profile-skeleton-hero">
        <div className="failure-profile-skeleton-icon" />
        <div className="failure-profile-skeleton-lines">
          <div className="failure-profile-skeleton-line failure-profile-skeleton-line--title" />
          <div className="failure-profile-skeleton-line" />
        </div>
      </div>
      <div className="failure-profile-skeleton-bars">
        <div className="failure-profile-skeleton-bar" />
        <div className="failure-profile-skeleton-bar failure-profile-skeleton-bar--short" />
        <div className="failure-profile-skeleton-bar failure-profile-skeleton-bar--shorter" />
      </div>
    </div>
  );
}

function FailureModeExplainer({ defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const modes = buildLandingFailuresContent();

  return (
    <div className="failure-profile-explainer">
      <button
        type="button"
        className="failure-profile-explainer-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        What are these patterns?
        <ChevronDown
          size={16}
          className={`failure-profile-explainer-chevron${open ? ' expanded' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <ul className="failure-profile-explainer-list">
          {modes.map((mode) => (
            <li key={mode.id} className={getFailureModeClassName(mode.id)}>
              <FailureModeIcon modeId={mode.id} size={16} />
              <div>
                <strong>{mode.title}</strong>
                <span>{mode.summary}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link to="/learn#failure-modes" className="failure-profile-explainer-link">
        Learn more on the Learn page →
      </Link>
    </div>
  );
}

function scrollToActivityType(activityType) {
  const el = document.querySelector(`[data-activity-type="${activityType}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('failure-profile-activity-highlight');
    setTimeout(() => el.classList.remove('failure-profile-activity-highlight'), 2000);
  }
}

export default function ModuleFailureProfileCard({
  profile,
  loading,
  moduleId,
  journeyId,
  journeyTitle,
  moduleName,
  activities = [],
  stage,
}) {
  const { data: prescription } = useModulePrescription(moduleId);
  const { data: dueItems = [] } = useDueToday();
  const launchDueItem = useLaunchDueItem();
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    const payload = maybeFirstEmergingToast({
      moduleId,
      profile,
      formatToast: formatFirstEmergingToast,
    });
    if (payload) {
      toast.message(payload.title, { description: payload.description });
    }
  }, [moduleId, profile?.hasData, profile?.primaryMode, profile?.primaryConfidence]);

  if (loading) {
    return (
      <section className="failure-profile-card detail-section-box" aria-label="Learning profile">
        <div className="failure-profile-header">
          <h3 className="failure-profile-title">Your learning profile</h3>
        </div>
        <ModuleFailureProfileSkeleton />
      </section>
    );
  }

  const hasData = profile?.hasData && profile?.primaryMode;
  const hasSessions = (profile?.evidenceSessionCount ?? 0) > 0;
  const meta = hasData ? getFailureModeMeta(profile.primaryMode) : null;
  const secondaryLine = hasData ? formatSecondaryModeLine(profile) : null;
  const modeClass = hasData ? getFailureModeClassName(profile.primaryMode) : '';

  const launchPlan = resolveTonightPrescriptionLaunch({
    moduleId,
    journeyId,
    journeyTitle,
    moduleName,
    prescription,
    dueItems,
    activities,
  });

  const handleStartPractice = async () => {
    if (!launchPlan?.item) return;
    setLaunching(true);
    try {
      await launchDueItem(launchPlan.item);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <section className="failure-profile-card detail-section-box" aria-label="Learning profile">
      <div className="failure-profile-header">
        <h3 className="failure-profile-title">Your learning profile</h3>
        {hasData && (
          <FailureProfileTrendBadge
            confidence={profile.primaryConfidence}
            trend={profile.trend}
          />
        )}
      </div>

      {!hasData && (
        <FailureProfileEmptyState
          evidenceSessionCount={profile?.evidenceSessionCount ?? 0}
          hasEmerging={false}
          showGhostBars={hasSessions}
        />
      )}

      {hasData && (
        <div className="failure-profile-body">
          <div className={`failure-profile-hero ${modeClass}`}>
            <FailureModeIcon modeId={profile.primaryMode} size={28} />
            <div className="failure-profile-hero-text">
              <p className="failure-profile-mode-name">{meta?.title}</p>
              <p className="failure-profile-explanation">{meta?.studentExplanation}</p>
            </div>
          </div>

          <FailureProfileRankedModes rankedModes={profile.rankedModes} />

          {secondaryLine && (
            <p className="failure-profile-secondary">{secondaryLine}</p>
          )}

          <FailureProfileConcepts concepts={profile.topConcepts} />

          {(stage === 'A' || prescription?.stage === 'A') && prescription?.shouldApply && (
            <p className="failure-profile-stage-a-note">
              We start with the Learning Guide so early practice isn&apos;t random.
            </p>
          )}

          <FailureProfilePrescriptionPreview
            prescription={prescription}
            onScrollToActivity={scrollToActivityType}
            onStartPractice={launchPlan ? handleStartPractice : undefined}
            ctaLabel={launchPlan?.ctaLabel}
            launching={launching}
          />

          {formatEvidenceCount(profile.evidenceSessionCount) && (
            <p className="failure-profile-meta">{formatEvidenceCount(profile.evidenceSessionCount)}</p>
          )}

          <FailureModeExplainer defaultOpen={false} />
        </div>
      )}
    </section>
  );
}
