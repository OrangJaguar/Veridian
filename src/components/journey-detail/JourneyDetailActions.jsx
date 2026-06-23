import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useArchiveJourney, useDeleteJourney } from '@/hooks/mutations/useJourneyMutations';

export default function JourneyDetailActions({ journey }) {
  const navigate = useNavigate();
  const archiveJourney = useArchiveJourney();
  const deleteJourney = useDeleteJourney();
  const [busy, setBusy] = useState(false);

  if (!journey || journey.archived) return null;

  const handleArchive = async () => {
    if (busy) return;
    const ok = window.confirm(
      `Archive "${journey.title}"? You can find it in the Archived tab on Journeys.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await archiveJourney.mutateAsync({
        journeyId: journey.journeyId,
        archived: true,
        archivedManually: true,
      });
      toast.success('Journey archived');
      navigate('/journeys');
    } catch (err) {
      toast.error(err?.message || 'Could not archive journey');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    const ok = window.confirm(
      `Permanently delete "${journey.title}"? This removes all modules, activities, and study history. This cannot be undone.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deleteJourney.mutateAsync(journey.journeyId);
      toast.success('Journey deleted');
      navigate('/journeys');
    } catch (err) {
      toast.error(err?.message || 'Could not delete journey');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="journey-detail-actions detail-section-box">
      <h2 className="journey-detail-section-title">Journey options</h2>
      <div className="journey-detail-actions-row">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleArchive}
          disabled={busy || archiveJourney.isPending || deleteJourney.isPending}
        >
          Archive journey
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm journey-delete-btn"
          onClick={handleDelete}
          disabled={busy || archiveJourney.isPending || deleteJourney.isPending}
        >
          Delete journey
        </button>
      </div>
    </section>
  );
}
