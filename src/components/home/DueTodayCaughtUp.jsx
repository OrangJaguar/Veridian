import { Link } from 'react-router-dom';

export default function DueTodayCaughtUp({ firstJourneyId }) {
  return (
    <article className="home-focus-card home-caught-up-card">
      <p className="home-focus-eyebrow">All clear</p>
      <h2 className="home-caught-up-title">You&apos;re all caught up for today.</h2>
      <p className="home-caught-up-sub">
        Nothing is due right now. Come back tomorrow or explore the library.
      </p>
      <div className="home-caught-up-actions">
        <Link to="/library" className="btn btn-secondary">
          Explore Community
        </Link>
        <Link to="/journeys/new" className="btn btn-primary">
          Start a New Journey
        </Link>
        {firstJourneyId ? (
          <Link to={`/journeys/${firstJourneyId}`} className="btn btn-secondary">
            Mastery Check
          </Link>
        ) : (
          <Link to="/journeys" className="btn btn-secondary">
            View Journeys
          </Link>
        )}
      </div>
    </article>
  );
}
