import { Link } from 'react-router-dom';
import { ReadinessBadge } from '@/components/journey-detail/JourneyDetailHeader';

const URGENCY_CLASS = { high: 'urgency-high', medium: 'urgency-medium', low: 'urgency-low' };

export default function RecommendedStudyPlan({ plan, loading }) {
  if (loading) {
    return (
      <section className="journey-study-plan">
        <h2 className="journey-detail-section-title">Recommended Study Plan</h2>
        <p className="journeys-status">Loading plan…</p>
      </section>
    );
  }

  if (!plan) return null;

  const { todayItems, weekPriorities, overallStatus } = plan;

  return (
    <section className="journey-study-plan">
      <div className="journey-study-plan-header">
        <h2 className="journey-detail-section-title">Recommended Study Plan</h2>
        <ReadinessBadge status={overallStatus} />
      </div>

      {todayItems.length === 0 ? (
        <p className="journey-study-plan-empty">No sessions recommended for today — you&apos;re caught up!</p>
      ) : (
        <ul className="journey-study-plan-today">
          {todayItems.map((item) => (
            <li key={item.id} className={`journey-study-plan-item ${URGENCY_CLASS[item.urgency] ?? ''}`}>
              <div className="journey-study-plan-item-main">
                <strong>{item.moduleName ?? item.activityLabel}</strong>
                <span>{item.activityLabel} — {item.reason}</span>
              </div>
              <Link to={item.href} className="btn btn-secondary btn-sm">
                Start · ~{item.estimatedMin} min
              </Link>
            </li>
          ))}
        </ul>
      )}

      {weekPriorities.length > 0 && (
        <div className="journey-study-plan-week">
          <h3 className="journey-study-plan-week-title">This week&apos;s priorities</h3>
          <ul className="journey-study-plan-week-list">
            {weekPriorities.map((p) => (
              <li key={p.moduleId}>
                <strong>{p.moduleName}</strong> — {p.note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
