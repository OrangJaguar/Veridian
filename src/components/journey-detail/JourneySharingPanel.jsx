import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ShareLinkButton from '@/components/shared/ShareLinkButton';
import LibraryTagPicker from '@/components/library/LibraryTagPicker';
import VeridianSwitch from '@/components/shared/form/VeridianSwitch';
import PublishJourneyModal from '@/components/journey-detail/PublishJourneyModal';
import { usePublishEligibility } from '@/hooks/queries/usePublishEligibility';
import {
  usePublishJourney,
  useUnpublishJourney,
  useUpdateJourneyLibrary,
} from '@/hooks/mutations/usePublishJourney';
import { MIN_TAGS_TO_PUBLISH } from '@/lib/library/libraryTags';
import { useIsJourneyOwner } from '@/hooks/useIsJourneyOwner';

export default function JourneySharingPanel({ journey }) {
  const isOwner = useIsJourneyOwner(journey);
  const journeyId = journey.journeyId;
  const { data: eligibility } = usePublishEligibility(journeyId);
  const publish = usePublishJourney();
  const unpublish = useUnpublishJourney();
  const updateLibrary = useUpdateJourneyLibrary();

  const [tags, setTags] = useState(journey.tags ?? []);
  const [isPublic, setIsPublic] = useState(!!journey.isPublic);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('requirements');

  useEffect(() => {
    setTags(journey.tags ?? []);
    setIsPublic(!!journey.isPublic);
  }, [journey.tags, journey.isPublic]);

  const saving = publish.isPending || unpublish.isPending || updateLibrary.isPending;

  const effectiveEligibility = eligibility
    ? {
      ...eligibility,
      tagCount: tags.length,
      tagsOk: tags.length >= MIN_TAGS_TO_PUBLISH,
      canPublish: eligibility.modulesOk
        && eligibility.activitiesOk
        && tags.length >= MIN_TAGS_TO_PUBLISH,
    }
    : null;

  if (!isOwner) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/library/${journeyId}`
    : `/library/${journeyId}`;

  const handleToggle = (nextPublic) => {
    if (nextPublic) {
      if (effectiveEligibility?.canPublish) {
        setModalMode('confirm');
        setModalOpen(true);
      } else {
        setModalMode('requirements');
        setModalOpen(true);
      }
      return;
    }

    setIsPublic(false);
    unpublish.mutate(journeyId, { onError: () => setIsPublic(true) });
  };

  const handleConfirmPublish = () => {
    setIsPublic(true);
    publish.mutate(
      { journeyId, tags },
      {
        onSuccess: () => setModalOpen(false),
        onError: () => setIsPublic(!!journey.isPublic),
      },
    );
  };

  const handleSaveTags = () => {
    updateLibrary.mutate({ journeyId, tags, isPublic: journey.isPublic ? true : undefined });
  };

  return (
    <section className="journey-sharing-panel detail-section-box">
      <div className="journey-sharing-header">
        <h2 className="journey-detail-section-title">Community sharing</h2>
        <div className="journey-visibility-control">
          <span className="journey-visibility-label">{isPublic ? 'Public' : 'Private'}</span>
          <VeridianSwitch
            checked={isPublic}
            disabled={saving}
            onChange={handleToggle}
            aria-label={isPublic ? 'Make journey private' : 'Make journey public'}
          />
        </div>
      </div>

      <p className="journey-sharing-lead">
        Share your journey in the Community Library so other students can preview and clone it.
        Cloned copies are independent — your progress stays private.
      </p>

      <LibraryTagPicker value={tags} onChange={setTags} />

      <div className="journey-sharing-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleSaveTags}
          disabled={saving}
        >
          Save tags
        </button>
        {isPublic && (
          <Link to={`/library/${journeyId}`} className="btn btn-secondary btn-sm">
            View in library
          </Link>
        )}
        {isPublic && (
          <ShareLinkButton url={shareUrl} label="Copy share link" />
        )}
        {isPublic && (
          <span className="journey-clone-count">
            {journey.cloneCount ?? 0} clone{(journey.cloneCount ?? 0) === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <PublishJourneyModal
        open={modalOpen}
        mode={modalMode}
        eligibility={effectiveEligibility}
        tagCount={tags.length}
        saving={publish.isPending}
        onConfirm={handleConfirmPublish}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
