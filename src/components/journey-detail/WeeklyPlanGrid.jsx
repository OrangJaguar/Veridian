import { useState } from 'react';
import { DAY_LABELS, ACTIVITY_LABELS } from '@/utils/weeklyPlan/constants';

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
      className={`weekly-plan-chip${selected ? ' selected' : ''}${isRest ? ' rest' : ''}${fsrsOnly ? ' fsrs' : ''}`}
      onClick={() => onSelect(day)}
      title={title}
    >
      <span className="weekly-plan-chip-day">{DAY_LABELS[day.dayIndex]}</span>
      <span className="weekly-plan-chip-label">{label}</span>
    </button>
  );
}

export default function WeeklyPlanGrid({ snapshot }) {
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
          </p>
          {selectedDay.assignments.length === 0 && selectedDay.fsrsCardCount === 0 && (
            <p className="weekly-plan-day-detail-empty">Rest day — no assignments</p>
          )}
          {selectedDay.assignments.map((a) => (
            <p key={a.activityId} className="weekly-plan-day-detail-row">
              {ACTIVITY_ICONS[a.activityType]}
              {a.moduleNumber != null && (
                <span className="weekly-plan-module-num">#{a.moduleNumber} </span>
              )}
              <strong>{a.moduleName}</strong>
              {' — '}{ACTIVITY_LABELS[a.activityType]}
            </p>
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
