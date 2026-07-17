import { useState } from 'react';
import { DAY_LABELS, ACTIVITY_LABELS } from '@/utils/weeklyPlan/constants';
import { formatReasonCopy, formatPrescriptionReasonCopy } from '@/utils/planner/reasonCopy';
import { getFailureModeMeta } from '@/utils/failures/taxonomy';
import PlanAssignmentControls from '@/components/planner/PlanAssignmentControls';

const ACTIVITY_ICONS = {
  learningGuide: '📖',
  practiceQuiz: '✏️',
  flashcardSet: '🃏',
  feynman: '💬',
  freeRecall: '🧠',
};

function DayChip({ day, onSelect, selected }) {
  const hasAssignments = day.assignments?.length > 0;
  const fsrsOnly = !hasAssignments && day.fsrsCardCount > 0;
  const isRest = day.isRestDay;
  const hasPinned = (day.assignments ?? []).some((a) => a.pinned);

  let label = '✓';
  let title = 'Rest day';

  if (hasAssignments) {
    const a = day.assignments[0];
    const moduleLabel = a.moduleNumber != null ? `#${a.moduleNumber}` : (a.moduleAbbr ?? '—');
    label = `${moduleLabel} ${ACTIVITY_ICONS[a.activityType] ?? '•'}`;
    title = `${a.moduleName}: ${ACTIVITY_LABELS[a.activityType] ?? a.activityType}`;
    if (day.assignments.length > 1) {
      title += ` (+${day.assignments.length - 1} more)`;
    }
  } else if (fsrsOnly) {
    label = `🃏 ${day.fsrsCardCount}`;
    title = `${day.fsrsCardCount} cards due`;
  }

  return (
    <button
      type="button"
      className={`weekly-plan-chip${selected ? ' selected' : ''}${isRest ? ' rest' : ''}${fsrsOnly ? ' fsrs' : ''}${hasPinned ? ' pinned' : ''}${day.unavailable ? ' unavailable' : ''}`}
      onClick={() => onSelect(day)}
      title={title}
    >
      <span className="weekly-plan-chip-day">{DAY_LABELS[day.dayIndex]}</span>
      <span className="weekly-plan-chip-label">{label}</span>
    </button>
  );
}

function AssignmentReason({ assignment, weekKey, dateKey }) {
  const reason = formatPrescriptionReasonCopy({
    reasonCode: assignment.reasonCode,
    moduleName: assignment.moduleName,
    prescriptionSummary: assignment.prescriptionSummary,
    includeModule: false,
  }) || formatReasonCopy(assignment.reasonCode, { moduleName: assignment.moduleName });

  const modeMeta = assignment.primaryMode
    ? getFailureModeMeta(assignment.primaryMode)
    : null;

  return (
    <div className="weekly-plan-assignment-reason">
      <p className="weekly-plan-day-detail-row">
        {ACTIVITY_ICONS[assignment.activityType]}
        {assignment.moduleNumber != null && (
          <span className="weekly-plan-module-num">#{assignment.moduleNumber} </span>
        )}
        <strong>{assignment.moduleName}</strong>
        {' · '}{ACTIVITY_LABELS[assignment.activityType] ?? assignment.activityType}
        {assignment.pinned && <span className="weekly-plan-pin-badge"> · pinned</span>}
      </p>
      {reason && (
        <p className="weekly-plan-why">Why: {reason}</p>
      )}
      {modeMeta && (
        <p className="weekly-plan-why-mode">Pattern: {modeMeta.title}</p>
      )}
      <PlanAssignmentControls
        assignment={assignment}
        weekKey={weekKey}
        dateKey={dateKey}
        compact
      />
    </div>
  );
}

export default function WeeklyPlanGrid({ snapshot, journeyId = null }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const days = snapshot?.days ?? [];

  const handleSelect = (day) => {
    setSelectedDay((prev) => (prev?.dateKey === day.dateKey ? null : day));
  };

  if (!days.length) return null;

  return (
    <div className="weekly-plan-grid-wrap">
      <div className="weekly-plan-grid" role="list" aria-label="Weekly study plan">
        {days.map((day) => (
          <DayChip
            key={day.dateKey}
            day={day}
            selected={selectedDay?.dateKey === day.dateKey}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {selectedDay && (
        <div className="weekly-plan-day-detail">
          <p className="weekly-plan-day-detail-title">
            {DAY_LABELS[selectedDay.dayIndex]} · ~{selectedDay.estimatedMin} min
            {selectedDay.unavailable ? ' · unavailable' : ''}
          </p>
          {selectedDay.assignments.length === 0 && selectedDay.fsrsCardCount === 0 && (
            <p className="weekly-plan-day-detail-empty">Rest day. No assignments.</p>
          )}
          {selectedDay.assignments.map((a) => (
            <AssignmentReason
              key={a.assignmentId ?? `${a.activityId}-${a.reasonCode}-${a.moduleId}`}
              assignment={{
                ...a,
                journeyId: a.journeyId ?? journeyId,
              }}
              weekKey={snapshot.weekKey}
              dateKey={selectedDay.dateKey}
            />
          ))}
          {selectedDay.fsrsCardCount > 0 && (
            <p className="weekly-plan-day-detail-row">
              🃏 {selectedDay.fsrsCardCount} flashcard{selectedDay.fsrsCardCount === 1 ? '' : 's'} due
            </p>
          )}
        </div>
      )}
    </div>
  );
}
