import { useMemo } from 'react';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';

function daysUntilExam(examDate) {
  return Math.ceil((examDate - Date.now()) / 86400000);
}

function urgencyClass(days) {
  if (days <= 7) return 'urgent';
  if (days <= 14) return 'soon';
  return 'muted';
}

function UpcomingRow({ journey }) {
  const { data: activities = [] } = useActivitiesByJourney(journey.journeyId);
  const launchStudy = useLaunchStudy();
  const challenge = activities.find((a) => a.type === 'journeyChallenge');
  const days = daysUntilExam(journey.examDate);
  const cls = urgencyClass(days);

  const handleChallenge = () => {
    if (!challenge) return;
    launchStudy({
      journeyId: journey.journeyId,
      activity: challenge,
      moduleId: null,
    });
  };

  const dayLabel = days === 0
    ? 'Today'
    : days === 1
      ? '1 day'
      : `${days} days`;

  return (
    <li className="home-upcoming-row">
      <div className="home-upcoming-row-main">
        <span className="home-upcoming-name">{journey.title}</span>
        <span className={`home-upcoming-days ${cls}`}>{dayLabel}</span>
      </div>
      {challenge && (
        <button type="button" className="btn btn-secondary btn-sm home-upcoming-btn" onClick={handleChallenge}>
          Challenge
        </button>
      )}
    </li>
  );
}

export default function HomeUpcomingSection({ journeys = [] }) {
  const withExam = useMemo(
    () => journeys
      .filter((j) => j.examDate && daysUntilExam(j.examDate) >= 0)
      .sort((a, b) => a.examDate - b.examDate)
      .slice(0, 5),
    [journeys],
  );

  if (withExam.length === 0) return null;

  return (
    <section className="home-upcoming" aria-labelledby="home-upcoming-heading">
      <h2 id="home-upcoming-heading" className="home-upcoming-title">Upcoming</h2>
      <ul className="home-upcoming-list">
        {withExam.map((journey) => (
          <UpcomingRow key={journey.journeyId ?? journey.id} journey={journey} />
        ))}
      </ul>
    </section>
  );
}
