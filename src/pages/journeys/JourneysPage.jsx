import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import JourneyCard, { journeyUrgencySort } from '@/components/journeys/JourneyCard';
import HomeDevTools from '@/components/dev/HomeDevTools';
import LoginPrompt from '@/components/stubs/LoginPrompt';

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('active');
  const archived = tab === 'archived';

  const { data: journeys = [], isLoading, error } = useJourneys({ archived });

  const sorted = useMemo(
    () => [...journeys].sort(journeyUrgencySort),
    [journeys],
  );

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <h1 className="stub-title">Journeys</h1>
        <p className="stub-description">
          Your full Journey library — create, manage, and track progress across subjects.
        </p>
        <LoginPrompt action="create and manage Journeys" />
      </div>
    );
  }

  return (
    <div className="journeys-page">
      <header className="journeys-header">
        <div>
          <h1 className="journeys-title">Journeys</h1>
        </div>
        <div className="journeys-header-actions">
          <Link to="/journeys/new" className="btn btn-primary">
            + New Journey
          </Link>
          <HomeDevTools />
        </div>
      </header>

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

      {isLoading && <p className="journeys-status">Loading Journeys…</p>}
      {error && (
        <p className="journeys-error">
          {error.message || 'Could not load Journeys. Publish entity schemas to Base44 first.'}
        </p>
      )}

      {!isLoading && !error && sorted.length === 0 && (
        <div className="journeys-empty">
          <h2>No Journeys yet</h2>
          <p>
            {archived
              ? 'No archived Journeys.'
              : 'Create your first Journey, or use the dev tools above to test with sample data.'}
          </p>
        </div>
      )}

      {!isLoading && !error && sorted.length > 0 && (
        <div className="journeys-grid">
          {sorted.map((journey) => (
            <JourneyCard
              key={journey.journeyId ?? journey.id}
              journey={journey}
              variant="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
