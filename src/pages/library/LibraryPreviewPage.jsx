import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLibraryPreview } from '@/hooks/queries/useLibraryPreview';
import { usePageMeta } from '@/hooks/usePageMeta';
import LoginPrompt from '@/components/stubs/LoginPrompt';
import VeridianLoading from '@/components/shared/VeridianLoading';
import CloneJourneyModal from '@/components/library/CloneJourneyModal';
import FlashcardPreviewModal from '@/components/library/FlashcardPreviewModal';
import ShareLinkButton from '@/components/shared/ShareLinkButton';
import VeridianCertifiedBanner from '@/components/journeys/VeridianCertifiedBanner';
import DetailBackButton from '@/components/shared/DetailBackButton';
import { certifiedAuthorLabel } from '@/lib/veridianCertified';
import { format } from 'date-fns';

export default function LibraryPreviewPage() {
  const { journeyId } = useParams();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, error } = useLibraryPreview(journeyId);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [previewDeck, setPreviewDeck] = useState(null);

  usePageMeta({
    title: 'Community Library',
    description: 'Preview a public study journey in the Veridian Community Library.',
    canonicalPath: journeyId ? `/library/${journeyId}` : '/library',
  });

  if (isLoading) return <VeridianLoading fullPage />;

  if (error || !data) {
    return (
      <div className="library-preview-page">
        <p className="library-error">Journey not found or not public.</p>
        <Link to="/library" className="btn">Back to Library</Link>
      </div>
    );
  }

  const { journey, modules, isOwner, totalCards, totalConcepts } = data;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/library/${journeyId}`
    : `/library/${journeyId}`;

  const publishedLabel = journey.publishedAt
    ? format(new Date(journey.publishedAt), 'MMM d, yyyy')
    : null;

  return (
    <div className="library-preview-page">
      {!isAuthenticated && (
        <div className="library-preview-banner">
          <LoginPrompt action="clone this journey" />
        </div>
      )}

      <header className="detail-title-header">
        <DetailBackButton to="/library" label="Community Library" />
        <div className="detail-title-body">
          <VeridianCertifiedBanner journey={journey} className="library-preview-certified" />
          <h1 className="journey-detail-title">{journey.title}</h1>
        </div>
      </header>

      <section className="detail-meta-section library-preview-meta-section" aria-label="Journey overview">
        <div className="detail-meta-tags library-preview-meta-tags">
          {journey.subject && <span>{journey.subject}</span>}
          {certifiedAuthorLabel(journey) && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{certifiedAuthorLabel(journey)}</span>
            </>
          )}
          <span className="journey-detail-meta-sep" aria-hidden>·</span>
          <span>{journey.cloneCount ?? 0} clone{(journey.cloneCount ?? 0) === 1 ? '' : 's'}</span>
          {publishedLabel && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>Published {publishedLabel}</span>
            </>
          )}
        </div>
        <div className="library-preview-stats-row">
          <span>{modules.length} modules</span>
          <span className="journey-detail-meta-sep" aria-hidden>·</span>
          <span>{totalConcepts} concepts</span>
          {totalCards > 0 && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{totalCards} flashcards</span>
            </>
          )}
        </div>
        {(journey.tags ?? []).length > 0 && (
          <div className="library-journey-tags library-preview-tags">
            {journey.tags.map((tag) => (
              <span key={tag} className="library-tag">{tag}</span>
            ))}
          </div>
        )}
      </section>

      <section className="library-preview-modules">
        <h2 className="library-preview-section-title">What&apos;s inside</h2>
        <div className="library-preview-module-grid">
          {modules.map((mod, index) => (
            <article key={mod.moduleId} className="library-preview-module-card detail-section-box">
              <header className="library-preview-module-head">
                <span className="library-preview-module-num" aria-hidden>{index + 1}</span>
                <h3 className="library-preview-module-title">{mod.name}</h3>
              </header>
              {mod.description && (
                <p className="library-preview-module-desc">{mod.description}</p>
              )}

              {mod.concepts.length > 0 && (
                <div className="library-preview-concepts">
                  <h4 className="library-preview-concepts-label">Concepts covered</h4>
                  <ul className="library-preview-concept-list">
                    {mod.concepts.map((c, i) => (
                      <li key={c.term + i}>
                        {c.term}
                        {c.definition && <span className="library-preview-concept-def"> — {c.definition}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {mod.flashcardDecks?.length > 0 && (
                <div className="library-preview-decks">
                  {mod.flashcardDecks.map((deck) => (
                    <button
                      key={deck.activityId}
                      type="button"
                      className="btn btn-secondary btn-sm library-preview-deck-btn"
                      onClick={() => setPreviewDeck(deck)}
                    >
                      View flashcards ({deck.cardCount})
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="library-preview-actions">
        <div className="library-preview-actions-row">
          <ShareLinkButton url={shareUrl} label="Copy share link" />
          {isOwner ? (
            <Link to={`/journeys/${journeyId}`} className="btn btn-primary">
              Open my journey
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!isAuthenticated) return;
                setCloneOpen(true);
              }}
              disabled={!isAuthenticated}
            >
              Clone this journey
            </button>
          )}
        </div>
        {isOwner ? (
          <p className="library-preview-signin-hint">This is your public journey — open it to study or edit.</p>
        ) : !isAuthenticated ? (
          <p className="library-preview-signin-hint">Sign in to clone and start studying</p>
        ) : null}
      </div>

      {cloneOpen && !isOwner && (
        <CloneJourneyModal
          journeyId={journeyId}
          sourceTitle={journey.title}
          modules={modules}
          onClose={() => setCloneOpen(false)}
        />
      )}

      {previewDeck && (
        <FlashcardPreviewModal
          deckTitle={previewDeck.title}
          cards={previewDeck.cards}
          onClose={() => setPreviewDeck(null)}
        />
      )}
    </div>
  );
}
