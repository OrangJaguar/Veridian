import WeeklyPlanGrid from '@/components/journey-detail/WeeklyPlanGrid';
import ModulePriorityList from '@/components/journey-detail/ModulePriorityList';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { formatWeekStrategy } from '@/utils/planner/reasonCopy';
import { isExamWeekMode, isKeepSharpMode } from '@/utils/weeklyPlan/weekKey';
import { resolveJourneyPacingMode } from '@/utils/planner/pacingMode';

export default function RecommendedStudyPlan({ plan, loading, journey }) {
  if (loading) {
    return (
      <section className="journey-study-plan detail-section-box">
        <VeridianLoading size="sm" />
      </section>
    );
  }

  if (journey?.generationStatus === 'processing') {
    return (
      <section className="journey-study-plan detail-section-box">
        <h3 className="journey-study-plan-week-title">Weekly plan</h3>
        <p className="journey-study-plan-pending">
          Your journey is still being generated — your study plan will appear when modules are ready.
        </p>
      </section>
    );
  }

  if (!plan?.snapshot) {
    return (
      <section className="journey-study-plan detail-section-box">
        <h3 className="journey-study-plan-week-title">Weekly plan</h3>
        <p className="journey-study-plan-pending">
          Your weekly plan is being prepared. Check back shortly or visit Home for Due Today.
        </p>
      </section>
    );
  }

  const { snapshot, mode } = plan;
  const examWeek = isExamWeekMode(mode) || isExamWeekMode(snapshot.mode);
  const keepSharp = !examWeek && (
    isKeepSharpMode(mode)
    || isKeepSharpMode(snapshot.mode)
    || resolveJourneyPacingMode(journey?.examDate) === 'keepSharp'
  );
  const weekStrategy = formatWeekStrategy(plan.weekStrategy ?? snapshot.weekStrategy);

  return (
    <section className="journey-study-plan detail-section-box">
      <div className="journey-study-plan-header">
        <h3 className="journey-study-plan-week-title">Weekly plan</h3>
        {examWeek && (
          <span className="cram-mode-badge exam-week-badge">Exam week</span>
        )}
        {keepSharp && (
          <span className="cram-mode-badge keep-sharp-badge">Keep sharp</span>
        )}
      </div>

      {weekStrategy && (
        <p className="journey-study-plan-strategy">{weekStrategy}</p>
      )}

      <WeeklyPlanGrid snapshot={snapshot} />

      <div className="journey-study-plan-priorities">
        <h4 className="journey-study-plan-priorities-title">Module priorities</h4>
        <ModulePriorityList summaries={snapshot.moduleSummaries} />
      </div>
    </section>
  );
}
