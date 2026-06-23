import WeeklyPlanGrid from '@/components/journey-detail/WeeklyPlanGrid';
import ModulePriorityList from '@/components/journey-detail/ModulePriorityList';
import VeridianLoading from '@/components/shared/VeridianLoading';

export default function RecommendedStudyPlan({ plan, loading }) {
  if (loading) {
    return (
      <section className="journey-study-plan detail-section-box">
        <VeridianLoading size="sm" />
      </section>
    );
  }

  if (!plan?.snapshot) return null;

  const { snapshot, mode } = plan;
  const isCram = mode === 'cram' || snapshot.mode === 'cram';

  return (
    <section className="journey-study-plan detail-section-box">
      <div className="journey-study-plan-header">
        <h3 className="journey-study-plan-week-title">Weekly plan</h3>
        {isCram && (
          <span className="cram-mode-badge">Cram mode</span>
        )}
      </div>

      <WeeklyPlanGrid snapshot={snapshot} />

      <div className="journey-study-plan-priorities">
        <h4 className="journey-study-plan-priorities-title">Module priorities</h4>
        <ModulePriorityList summaries={snapshot.moduleSummaries} />
      </div>
    </section>
  );
}
