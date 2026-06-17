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

export default function JourneyCard({ journey, variant = 'default' }) {
  const { data: modules = [] } = useModules(journey.journeyId);
  const { data: cards = [] } = useCardsByJourney(journey.journeyId);
  const mastery = averageMastery(modules);
  const lastStudiedWarn = isLastStudiedWarning(journey.lastStudiedAt, journey.examDate);
  const statusNote = getJourneyStatusNote(journey, modules, cards);
  const lineage = cloneLineageLabel(journey);

  if (variant === 'compact' || variant === 'list') {
    return (
      <Link to={`/journeys/${journey.journeyId}`} className="journey-card">
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
