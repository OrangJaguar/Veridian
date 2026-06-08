import { format, differenceInDays } from 'date-fns';
import { averageModuleMastery } from '@/utils/mastery';
import { OVERALL_STATUS_LABELS } from '@/utils/journeyStatus';

export default function JourneyDetailHeader({ journey, modules }) {
  const mastery = averageModuleMastery(modules);
  const daysLeft = journey.examDate
    ? differenceInDays(new Date(journey.examDate), new Date())
    : null;

  let deadlineText = 'No deadline set';
  if (journey.examDate) {
    const dateStr = format(new Date(journey.examDate), 'MMMM d');
    if (daysLeft != null && daysLeft >= 0) {
      deadlineText = `${dateStr} — ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`;
    } else {
      deadlineText = `${dateStr} — past deadline`;
    }
  }

  return (
    <header className="journey-detail-header">
      <p className="journey-detail-subject">{journey.subject}</p>
      <h1 className="journey-detail-title">{journey.title}</h1>
      <p className="journey-detail-deadline">{deadlineText}</p>
      <div className="journey-detail-stats">
        <span className="journey-detail-stat">
          <strong>{mastery}%</strong> overall mastery
        </span>
      </div>
    </header>
  );
}

export function ReadinessBadge({ status }) {
  const label = OVERALL_STATUS_LABELS[status] ?? status;
  const cls = status === 'onTrack' ? 'green' : status === 'behind' ? 'red' : 'yellow';
  return <span className={`journey-readiness journey-readiness-${cls}`}>{label}</span>;
}
