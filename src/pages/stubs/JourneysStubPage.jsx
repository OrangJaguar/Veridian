import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useJourneys } from '@/hooks/queries/useJourneys';
import JourneyCard from '@/components/journeys/JourneyCard';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function JourneysStubPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState('active');
  const archived = tab === 'archived';

  const { data: journeys = [], isPending, error } = useJourneys({ archived });

  if (!isAuthenticated) {
    return (
      <div className="stub-page">
        <p className="stub-phase">Phase 2</p>
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

      {isPending && journeys.length === 0 && <VeridianLoading />}
      {error && (
        <p className="journeys-error">
          {error.message || 'Could not load Journeys. Publish entity schemas to Base44 first.'}
        </p>
      )}

      {!isPending && !error && journeys.length === 0 && (
        <div className="journeys-empty">
          <h2>No Journeys yet</h2>
          <p>
            {archived
              ? 'No archived Journeys.'
              : 'Create your first Journey in Phase 4, or use the dev tools above to test.'}
          </p>
        </div>
      )}

      {!isPending && !error && journeys.length > 0 && (
        <div className="journeys-grid">
          {journeys.map((journey) => (
            <JourneyCard
              key={journey.journeyId ?? journey.id}
              journey={journey}
              variant="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
}
