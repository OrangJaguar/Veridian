import { Link } from 'react-router-dom';
import { urgencyLabel } from '@/components/journeys/journeyUtils';

const ACTION_VERBS = {
  flashcardSet: 'Review',
  practiceQuiz: 'Start',
  learningGuide: 'Continue',
  feynman: 'Start',
  freeRecall: 'Start',
  synthesis: 'Start',
  interleavedReview: 'Start',
  journeyChallenge: 'Start',
};

export default function DueTodayCard({ item }) {
  const verb = ACTION_VERBS[item.activityType] ?? 'Start';
  const urgency = urgencyLabel(item.urgencyDays);

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
        {urgency && <span className="home-due-card-urgency">{urgency}</span>}
      </div>
      <p className="home-due-card-activity">{item.activityLabel}</p>
      <p className="home-due-card-action">{item.actionLabel}</p>
      <div className="home-due-card-footer">
        <span className="home-due-card-time">~{item.estimatedMin} min</span>
        <Link to={item.href} className="btn btn-primary home-due-card-btn">
          {verb}
        </Link>
      </div>
    </div>
  );
}
