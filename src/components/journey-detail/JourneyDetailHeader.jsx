import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import DetailBackButton from '@/components/shared/DetailBackButton';
import EditableRenameTitle from '@/components/shared/EditableRenameTitle';
import { averageModuleMastery } from '@/utils/mastery';
import { buildJourneyTitleRules } from '@/components/auth/AuthFieldRules';
import { isValidJourneyTitle, normalizeJourneyTitle } from '@/utils/schemas/journeyTitle';
import { useUpdateJourney } from '@/hooks/mutations/useJourneyMutations';
import { resolveJourneyPacingMode } from '@/utils/planner/pacingMode';
import { toast } from 'sonner';

export default function JourneyDetailHeader({ journey, modules }) {
  const updateJourney = useUpdateJourney();
  const mastery = averageModuleMastery(modules);
  const daysLeft = journey.examDate
    ? differenceInDays(new Date(journey.examDate), new Date())
    : null;
  const pacing = resolveJourneyPacingMode(journey.examDate);
  const [examDraft, setExamDraft] = useState('');
  const [settingExam, setSettingExam] = useState(false);

  const examDateLabel = journey.examDate
    ? format(new Date(journey.examDate), 'MMM d, yyyy')
    : null;

  const daysLabel = daysLeft == null
    ? null
    : daysLeft < 0
      ? 'Past deadline'
      : daysLeft === 0
        ? 'Today'
        : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;

  const handleRename = (title) => {
    updateJourney.mutate({ journeyId: journey.journeyId, patch: { title } });
  };

  const showSetExam = pacing === 'keepSharp';

  const handleSetExam = async () => {
    if (!examDraft) return;
    const examMs = new Date(`${examDraft}T12:00:00`).getTime();
    setSettingExam(true);
    try {
      await updateJourney.mutateAsync({
        journeyId: journey.journeyId,
        patch: { examDate: examMs },
      });
      toast.success('Exam date set — plan will rebuild');
      setExamDraft('');
    } catch (err) {
      toast.error(err?.message || 'Could not set exam date');
    } finally {
      setSettingExam(false);
    }
  };

  return (
    <>
      <header className="detail-title-header">
        <DetailBackButton to="/journeys" label="Journeys" />
        <div className="detail-title-body">
          <EditableRenameTitle
            value={journey.title}
            onSave={handleRename}
            buildRules={buildJourneyTitleRules}
            isValid={isValidJourneyTitle}
            normalize={normalizeJourneyTitle}
            titleClassName="journey-detail-title"
            modalTitle="Journey title requirements"
          />
        </div>
      </header>

      <section className="detail-meta-section" aria-label="Journey details">
        <div className="detail-meta-tags">
          <span>{journey.subject}</span>
          {examDateLabel ? (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{examDateLabel}</span>
            </>
          ) : (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>No deadline</span>
            </>
          )}
          {daysLabel && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{daysLabel}</span>
            </>
          )}
          {pacing === 'keepSharp' && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span className="keep-sharp-badge">Keep sharp</span>
            </>
          )}
        </div>
        <div className="detail-meta-mastery">
          <div className="detail-mastery-bar" aria-hidden>
            <div className="detail-mastery-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="detail-mastery-label">{mastery}% mastery</span>
        </div>
        {showSetExam && (
          <div className="journey-set-exam-row">
            <label className="journey-set-exam-label">
              Set exam date
              <input
                type="date"
                value={examDraft}
                onChange={(e) => setExamDraft(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!examDraft || settingExam || updateJourney.isPending}
              onClick={handleSetExam}
            >
              {settingExam ? 'Saving…' : 'Save exam date'}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
