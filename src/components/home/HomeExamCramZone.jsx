import { Link } from 'react-router-dom';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useModules } from '@/hooks/queries/useModules';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { journeyWideActivitiesUnlocked } from '@/utils/study/journeyUnlock';

function CramBanner({ journey }) {
  const { data: activities = [] } = useActivitiesByJourney(journey.journeyId);
  const { data: modules = [] } = useModules(journey.journeyId);
  const launchStudy = useLaunchStudy();
  const cram = activities.find((a) => a.type === 'cramSession');
  const daysUntilExam = Math.ceil((journey.examDate - Date.now()) / 86400000);
  const unlocked = journeyWideActivitiesUnlocked(modules);

  const handleCram = () => {
    if (!cram || !unlocked) return;
    launchStudy({
      journeyId: journey.journeyId,
      activity: cram,
      moduleId: null,
      initialSessionData: {
        cramConfig: {
          durationMin: 15,
          selectedModuleIds: modules
            .filter((m) => m.stage === 'B' || m.stage === 'C')
            .map((m) => m.moduleId),
        },
      },
    });
  };

  return (
    <div className="home-cram-banner">
      <div className="home-cram-banner-text">
        <strong>{journey.title}</strong>
        <span>
          Exam in {daysUntilExam} day{daysUntilExam === 1 ? '' : 's'} — build a focused cram session
        </span>
      </div>
      <div className="home-cram-banner-actions">
        {cram && unlocked ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCram}>
            Cram Session (15 min)
          </button>
        ) : (
          <Link to={`/journeys/${journey.journeyId}`} className="btn btn-secondary btn-sm">
            Open Journey
          </Link>
        )}
      </div>
    </div>
  );
}

export default function HomeExamCramZone({ journeys = [] }) {
  const examNear = journeys.filter(
    (j) => j.examDate && Math.ceil((j.examDate - Date.now()) / 86400000) <= 7,
  );

  if (examNear.length === 0) return null;

  return (
    <section className="home-exam-cram" aria-labelledby="exam-cram-heading">
      <h2 id="exam-cram-heading" className="home-exam-cram-title">Exam coming up</h2>
      <div className="home-cram-stack">
        {examNear.map((journey) => (
          <CramBanner key={journey.journeyId ?? journey.id} journey={journey} />
        ))}
      </div>
    </section>
  );
}
