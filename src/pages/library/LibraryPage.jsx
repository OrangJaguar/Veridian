import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePublicJourneys } from '@/hooks/queries/usePublicJourneys';
import LibrarySearchBar from '@/components/library/LibrarySearchBar';
import LibraryJourneyCard from '@/components/library/LibraryJourneyCard';
import VeridianLoading from '@/components/shared/VeridianLoading';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import { isVeridianCertifiedJourney } from '@/lib/veridianCertified';

export default function LibraryPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('cloned');

  const { data: journeys = [], isLoading, isError } = usePublicJourneys({
    search,
    category,
    sort,
  });

  const debouncedSearch = search;

  const certifiedJourneys = useMemo(
    () => journeys.filter((j) => isVeridianCertifiedJourney(j)),
    [journeys],
  );
  const communityJourneys = useMemo(
    () => journeys.filter((j) => !isVeridianCertifiedJourney(j)),
    [journeys],
  );

  return (
    <div className="library-page">
      <header className="library-page-header">
        <h1 className="library-page-title">Community Library</h1>
        <p className="library-page-lead">
          Browse, Personalize and Clone study Journeys
        </p>
        {!isAuthenticated && (
          <div className="library-auth-banner">
            <LoginPrompt action="clone journeys to your account" />
          </div>
        )}
      </header>

      <LibrarySearchBar
        search={debouncedSearch}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {isLoading && <VeridianLoading size="sm" />}

      {isError && (
        <p className="library-error">Could not load library. Try again later.</p>
      )}

      {!isLoading && !isError && journeys.length === 0 && (
        <div className="library-empty">
          <p>No public journeys match your search yet.</p>
          <Link to="/journeys/new" className="btn btn-primary">Create your own journey</Link>
        </div>
      )}

      {!isLoading && journeys.length > 0 && (
        <>
          {certifiedJourneys.length > 0 && (
            <section className="library-certified-section">
              <h2 className="library-section-title">Veridian Certified</h2>
              <p className="library-section-lead">Curated study paths built by the Veridian team.</p>
              <div className="library-grid">
                {certifiedJourneys.map((j) => (
                  <LibraryJourneyCard key={j.journeyId} journey={j} />
                ))}
              </div>
            </section>
          )}
          {communityJourneys.length > 0 && (
            <section className="library-community-section">
              {certifiedJourneys.length > 0 ? (
                <h2 className="library-section-title">Community journeys</h2>
              ) : null}
              <div className="library-grid">
                {communityJourneys.map((j) => (
                  <LibraryJourneyCard key={j.journeyId} journey={j} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
