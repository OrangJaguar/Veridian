import { format, differenceInDays } from 'date-fns';
import DetailBackButton from '@/components/shared/DetailBackButton';
import EditableRenameTitle from '@/components/shared/EditableRenameTitle';
import { averageModuleMastery } from '@/utils/mastery';
import { buildJourneyTitleRules } from '@/components/auth/AuthFieldRules';
import { isValidJourneyTitle, normalizeJourneyTitle } from '@/utils/schemas/journeyTitle';
import { useUpdateJourney } from '@/hooks/mutations/useJourneyMutations';

export default function JourneyDetailHeader({ journey, modules }) {
  const updateJourney = useUpdateJourney();
  const mastery = averageModuleMastery(modules);
  const daysLeft = journey.examDate
    ? differenceInDays(new Date(journey.examDate), new Date())
    : null;

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
          {examDateLabel && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{examDateLabel}</span>
            </>
          )}
          {daysLabel && (
            <>
              <span className="journey-detail-meta-sep" aria-hidden>·</span>
              <span>{daysLabel}</span>
            </>
          )}
        </div>
        <div className="detail-meta-mastery">
          <div className="detail-mastery-bar" aria-hidden>
            <div className="detail-mastery-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="detail-mastery-label">{mastery}% mastery</span>
        </div>
      </section>
    </>
  );
}
