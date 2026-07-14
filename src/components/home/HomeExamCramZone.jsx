import { Link } from 'react-router-dom';
import { useActivitiesByJourney } from '@/hooks/queries/useActivities';
import { useModules } from '@/hooks/queries/useModules';
import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { journeyWideActivitiesUnlocked } from '@/utils/study/journeyUnlock';
import { daysUntilExam, isExamWeek } from '@/utils/weeklyPlan/weekKey';

function ExamWeekBanner({ journey }) {
  const { data: activities = [] } = useActivitiesByJourney(journey.journeyId);
  const { data: modules = [] } = useModules(journey.journeyId);
  const launchStudy = useLaunchStudy();
  const cram = activities.find((a) => a.type === 'cramSession');
  const days = daysUntilExam(journey.examDate) ?? 0;
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
    <div className="home-cram-banner home-exam-week-banner">
      <div className="home-cram-banner-text">
        <strong>{journey.title}</strong>
        <span>
          Exam in {days} day{days === 1 ? '' : 's'} — denser plan + optional Cram Session
        </span>
      </div>
      <div className="home-cram-banner-actions">
        {cram && unlocked ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCram}>
            Cram Session
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
  const examNear = journeys.filter((j) => isExamWeek(j.examDate));

  if (examNear.length === 0) return null;

  return (
    <section className="home-exam-cram home-exam-week" aria-labelledby="exam-week-heading">
      <h2 id="exam-week-heading" className="home-exam-cram-title">Exam week</h2>
      <div className="home-cram-stack">
        {examNear.map((journey) => (
          <ExamWeekBanner key={journey.journeyId ?? journey.id} journey={journey} />
        ))}
      </div>
    </section>
  );
}
