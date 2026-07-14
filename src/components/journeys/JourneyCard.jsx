import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { useModules } from '@/hooks/queries/useModules';
import { useCardsByJourney } from '@/hooks/queries/useCards';
import {
  examLabel,
  formatLastStudied,
  isLastStudiedWarning,
  averageMastery,
} from '@/components/journeys/journeyUtils';
import { getJourneyStatusNote } from '@/utils/journeyStatus';
import { cloneLineageLabel } from '@/lib/veridianCertified';

function JourneyCreatingCard({ journey, variant, manualArchiveClass }) {
  const isList = variant === 'compact' || variant === 'list';

  return (
    <div
      className={`journey-card journey-card--creating${isList ? '' : ' journey-card-home'}${manualArchiveClass}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="journey-card-top">
        <span className="journey-card-subject">{journey.subject}</span>
        <span className="journey-card-deadline">{examLabel(journey.examDate)}</span>
      </div>
      <h2 className="journey-card-title">{journey.title}</h2>
      <p className="journey-card-meta">
        Building modules from your material…
      </p>
      <div className="journey-card-progress journey-card-progress--creating" aria-hidden="true">
        <div className="journey-card-progress-bar">
          <div className="journey-card-progress-fill journey-card-progress-fill--shimmer" />
        </div>
        <span className="journey-card-progress-label">—</span>
      </div>
      <p className="journey-card-creating-overlay">Creating your journey…</p>
    </div>
  );
}

function JourneyFailedCard({ journey, variant, manualArchiveClass }) {
  const isList = variant === 'compact' || variant === 'list';

  return (
    <div className={`journey-card journey-card--failed${isList ? '' : ' journey-card-home'}${manualArchiveClass}`}>
      <div className="journey-card-top">
        <span className="journey-card-subject">{journey.subject}</span>
        <span className="journey-card-deadline">{examLabel(journey.examDate)}</span>
      </div>
      <h2 className="journey-card-title">{journey.title}</h2>
      <p className="journey-card-status journey-card-status-warn">
        Generation failed — try again
      </p>
      <Link to="/journeys/new" className="btn btn-ghost journey-card-retry-link">
        Create again
      </Link>
    </div>
  );
}

export default function JourneyCard({ journey, variant = 'default', showManualArchiveStyle = false }) {
  const isProcessing = journey.generationStatus === 'processing';
  const isFailed = journey.generationStatus === 'failed';
  const skipData = isProcessing || isFailed;
  const journeyId = skipData ? null : journey.journeyId;

  const { data: modules = [] } = useModules(journeyId);
  const { data: cards = [] } = useCardsByJourney(journeyId);
  const mastery = averageMastery(modules);
  const lastStudiedWarn = isLastStudiedWarning(journey.lastStudiedAt, journey.examDate);
  const statusNote = getJourneyStatusNote(journey, modules, cards);
  const lineage = cloneLineageLabel(journey);

  const manualArchiveClass = showManualArchiveStyle && journey.archivedManually
    ? ' journey-card--manual-archive'
    : '';

  if (isProcessing) {
    return <JourneyCreatingCard journey={journey} variant={variant} manualArchiveClass={manualArchiveClass} />;
  }

  if (isFailed) {
    return <JourneyFailedCard journey={journey} variant={variant} manualArchiveClass={manualArchiveClass} />;
  }

  if (variant === 'compact' || variant === 'list') {
    return (
      <Link to={`/journeys/${journey.journeyId}`} className={`journey-card${manualArchiveClass}`}>
        <div className="journey-card-top">
          <span className="journey-card-subject">{journey.subject}</span>
          <span className="journey-card-deadline">{examLabel(journey.examDate)}</span>
        </div>
        <h2 className="journey-card-title">{journey.title}</h2>
        {lineage && <p className="journey-card-lineage">{lineage}</p>}
        <p className="journey-card-meta">
          {modules.length} module{modules.length === 1 ? '' : 's'}
          {journey.examDate && (
            <> · {format(new Date(journey.examDate), 'MMM d, yyyy')}</>
          )}
        </p>
        <div className="journey-card-progress">
          <div className="journey-card-progress-bar">
            <div className="journey-card-progress-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="journey-card-progress-label">{mastery}% mastery</span>
        </div>
        <p className={`journey-card-status journey-card-status-${statusNote.color}`}>
          {statusNote.text}
        </p>
      </Link>
    );
  }

  return (
    <Link to={`/journeys/${journey.journeyId}`} className="journey-card journey-card-home">
      <div className="journey-card-top">
        <span className="journey-card-subject">{journey.subject}</span>
        <span className="journey-card-deadline">{examLabel(journey.examDate)}</span>
      </div>
      <h2 className="journey-card-title">{journey.title}</h2>
      <div className="journey-card-progress">
        <div className="journey-card-progress-bar">
          <div className="journey-card-progress-fill" style={{ width: `${mastery}%` }} />
        </div>
        <span className="journey-card-progress-label">{mastery}% mastery</span>
      </div>
      <p className={`journey-card-status journey-card-status-${statusNote.color}`}>
        {statusNote.text}
      </p>
      <p className={`journey-card-meta${lastStudiedWarn ? ' journey-card-meta-warn' : ''}`}>
        {formatLastStudied(journey.lastStudiedAt)}
        {modules.length > 0 && <> · {modules.length} modules</>}
      </p>
    </Link>
  );
}

export function journeyUrgencySort(a, b) {
  const daysA = a.examDate
    ? Math.max(0, differenceInDays(new Date(a.examDate), new Date()))
    : 9999;
  const daysB = b.examDate
    ? Math.max(0, differenceInDays(new Date(b.examDate), new Date()))
    : 9999;
  return daysA - daysB;
}

export function journeyListSort(a, b) {
  const aProcessing = a.generationStatus === 'processing' ? 0 : 1;
  const bProcessing = b.generationStatus === 'processing' ? 0 : 1;
  if (aProcessing !== bProcessing) return aProcessing - bProcessing;
  return journeyUrgencySort(a, b);
}
