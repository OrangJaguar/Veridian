import { useLaunchStudy } from '@/hooks/study/useLaunchStudy';
import { getActivity } from '@/api/entities/activities';

const ACTION_VERBS = {
  flashcardSet: 'Review',
  practiceQuiz: 'Start',
  learningGuide: 'Continue',
  feynman: 'Start',
  freeRecall: 'Start',
  interleavedReview: 'Start',
  journeyChallenge: 'Start',
};

export default function DueTodayCard({ item }) {
  const verb = ACTION_VERBS[item.activityType] ?? 'Start';
  const launchStudy = useLaunchStudy();

  const handleLaunch = async () => {
    const activity = await getActivity(item.activityId);
    if (!activity) return;
    await launchStudy({
      journeyId: item.journeyId,
      activity,
      moduleId: item.moduleId ?? undefined,
    });
  };

  return (
    <div className="home-due-card">
      <div className="home-due-card-top">
        <div>
          <span className="home-due-card-subject">{item.subject}</span>
          <strong className="home-due-card-title">
            {item.journeyTitle}
            {item.moduleName && <> · {item.moduleName}</>}
          </strong>
        </div>
      </div>
      <p className="home-due-card-activity">{item.activityLabel}</p>
      <p className="home-due-card-action">{item.actionLabel}</p>
      <div className="home-due-card-footer">
        <span className="home-due-card-time">~{item.estimatedMin} min</span>
        <button type="button" className="btn btn-primary home-due-card-btn" onClick={handleLaunch}>
          {verb}
        </button>
      </div>
    </div>
  );
}
