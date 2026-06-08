import { Link } from 'react-router-dom';
import { notifyCreateJourney } from '@/components/home/DueTodayCard';

export default function DueTodayCaughtUp({ firstJourneyId }) {
  return (
    <div className="home-caught-up">
      <h2 className="home-caught-up-title">You&apos;re all caught up for today.</h2>
      <p className="home-caught-up-sub">
        Nothing is due right now. Come back tomorrow or explore below.
      </p>
      <div className="home-caught-up-chips">
        <Link to="/library" className="home-caught-up-chip">
          Explore Community
        </Link>
        <button type="button" className="home-caught-up-chip" onClick={notifyCreateJourney}>
          Start a New Journey
        </button>
        {firstJourneyId ? (
          <Link to={`/journeys/${firstJourneyId}`} className="home-caught-up-chip">
            Mastery Check
          </Link>
        ) : (
          <Link to="/journeys" className="home-caught-up-chip">
            View Journeys
          </Link>
        )}
      </div>
    </div>
  );
}
