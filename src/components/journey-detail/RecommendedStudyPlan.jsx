import { useState } from 'react';
import { format } from 'date-fns';
import ExpandToggle from '@/components/shared/ExpandToggle';
import VeridianLoading from '@/components/shared/VeridianLoading';

function buildOverallPlanParagraphs(journey, modules, plan) {
  const days = plan?.daysUntilExam;
  const moduleCount = modules.length;
  const stageBCount = modules.filter((m) => m.stage === 'B').length;
  const paragraphs = [];

  if (days != null && days >= 0) {
    const examStr = journey.examDate
      ? format(new Date(journey.examDate), 'MMMM d')
      : 'your exam';
    paragraphs.push(
      `You have ${days} day${days === 1 ? '' : 's'} until ${examStr}. Spread your effort across ${moduleCount} module${moduleCount === 1 ? '' : 's'}, moving each from Learn → Practice → Mastery rather than rushing one topic.`,
    );
  } else {
    paragraphs.push(
      `Work through ${moduleCount} module${moduleCount === 1 ? '' : 's'} at a steady pace — Learn first, then Practice, then Mastery activities.`,
    );
  }

  paragraphs.push(
    'Stage A (Learn): Complete the learning guide for each module before heavy practice. Allow 1–2 sessions per module to build a foundation.',
  );
  paragraphs.push(
    'Stage B (Practice): Aim for one practice quiz every 2–3 days per module, plus daily flashcard reviews when cards are due. This is where most exam readiness is built.',
  );
  paragraphs.push(
    'Stage C (Mastery): Introduce Feynman and Free Recall once a module is above ~70% mastery — these deepen understanding, not replace practice.',
  );

  if (stageBCount >= 2) {
    paragraphs.push(
      'Journey-wide: With 2+ modules in Stage B, add an interleaved review weekly and a journey challenge every 1–2 weeks to test cross-topic recall.',
    );
  } else {
    paragraphs.push(
      'Journey-wide: Interleaved review and journey challenges unlock once 2+ modules reach Stage B.',
    );
  }

  return paragraphs;
}

export default function RecommendedStudyPlan({ plan, loading, journey, modules = [] }) {
  const [planExpanded, setPlanExpanded] = useState(false);

  if (loading) {
    return (
      <section className="journey-study-plan detail-section-box">
        <VeridianLoading size="sm" />
      </section>
    );
  }

  if (!plan) return null;

  const { weekPriorities = [] } = plan;
  const overallParagraphs = buildOverallPlanParagraphs(journey, modules, plan);

  return (
    <section className="journey-study-plan detail-section-box">
      <div className="journey-study-plan-week">
        <h3 className="journey-study-plan-week-title">This week&apos;s priorities</h3>
        {weekPriorities.length === 0 ? (
          <p className="journey-study-plan-empty">No specific priorities this week — keep your daily rhythm.</p>
        ) : (
          <ul className="journey-study-plan-week-list">
            {weekPriorities.map((p) => (
              <li key={p.moduleId}>
                <strong>{p.moduleName}</strong> — {p.note}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="journey-study-plan-overall">
        <ExpandToggle
          expanded={planExpanded}
          onClick={() => setPlanExpanded(!planExpanded)}
          className="journey-study-plan-overall-toggle"
        >
          Overall plan
        </ExpandToggle>
        {planExpanded && (
          <div className="journey-study-plan-overall-body">
            {overallParagraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
