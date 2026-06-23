import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import { useRemoveStarterJourney } from '@/hooks/useRemoveStarterJourney';
import JourneyCard, { journeyUrgencySort } from '@/components/journeys/JourneyCard';
import JourneysEmptyState from '@/components/journeys/JourneysEmptyState';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function JourneysPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('active');
  const archived = tab === 'archived';

  const { data: journeys = [], isPending, error } = useJourneys({ archived });
  useRemoveStarterJourney();

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

      {(isPending && journeys.length === 0) ? (
        <VeridianLoading className="journeys-page-loader" />
      ) : null}
      {error && (
        <p className="journeys-error">
          {error.message || 'Could not load Journeys.'}
        </p>
      )}

      {!isPending && !error && sorted.length === 0 && (
        <JourneysEmptyState archived={archived} />
      )}

      {!isPending && !error && sorted.length > 0 && (
        <div className="journeys-grid">
          {sorted.map((journey) => (
            <JourneyCard
              key={journey.journeyId ?? journey.id}
              journey={journey}
              variant="list"
              showManualArchiveStyle={archived}
            />
          ))}
        </div>
      )}
    </div>
  );
}
