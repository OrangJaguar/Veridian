import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useJourneys } from '@/hooks/queries/useJourneys';
import JourneyCard from '@/components/journeys/JourneyCard';
import VeridianLoading from '@/components/shared/VeridianLoading';
export default function JourneyGridZone() {
  const [tab, setTab] = useState('active');
  const archived = tab === 'archived';
  const { data: journeys = [], isPending, error } = useJourneys({ archived });

  return (
    <section className="home-journey-zone" aria-labelledby="your-journeys-heading">
      <div className="home-journey-zone-header">
        <h2 id="your-journeys-heading" className="home-journey-zone-title">Your Journeys</h2>
        <Link to="/journeys/new" className="btn btn-secondary">
          + New Journey
        </Link>
      </div>

      <div className="journeys-tabs">
        <button
          type="button"
          className={`journeys-tab${tab === 'active' ? ' active' : ''}`}
          onClick={() => setTab('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={`journeys-tab${tab === 'archived' ? ' active' : ''}`}
          onClick={() => setTab('archived')}
        >
          Archived
        </button>
      </div>

      {isPending && journeys.length === 0 && <VeridianLoading size="sm" />}
      {error && (
        <p className="journeys-error">{error.message || 'Could not load Journeys.'}</p>
      )}

      {!isPending && !error && journeys.length === 0 && (
        <p className="journey-detail-empty">
          {archived ? 'No archived Journeys.' : 'No active Journeys in this tab.'}
          {!archived && (
            <>
              {' '}
              <Link to="/journeys">View all Journeys</Link>
            </>
          )}
        </p>
      )}

      {!isPending && !error && journeys.length > 0 && (
        <div className="home-journey-grid">
          {journeys.map((journey) => (
            <JourneyCard key={journey.journeyId ?? journey.id} journey={journey} variant="home" />
          ))}
        </div>
      )}
    </section>
  );
}
