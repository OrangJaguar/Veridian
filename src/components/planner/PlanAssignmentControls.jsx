import { usePlanAssignmentControls } from '@/hooks/mutations/usePlanOverrideMutations';

const ACTIONS = [
  { id: 'skip', label: 'Skip' },
  { id: 'snooze', label: 'Snooze 1d' },
  { id: 'pin', label: 'Pin' },
  { id: 'undo', label: 'Undo' },
];

/**
 * Lightweight planner override controls for Due Today / weekly plan assignments.
 */
export default function PlanAssignmentControls({
  assignment,
  weekKey,
  dateKey,
  compact = false,
  className = '',
}) {
  const { run, isPending } = usePlanAssignmentControls();

  if (!assignment?.assignmentId && !assignment?.planAssignment) {
    return null;
  }

  const item = {
    ...assignment,
    weekKey: assignment.weekKey ?? weekKey,
    dateKey: assignment.dateKey ?? dateKey,
  };

  if (!item.assignmentId) return null;

  return (
    <div className={`plan-assignment-controls${compact ? ' compact' : ''} ${className}`.trim()}>
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="btn btn-ghost btn-xs plan-control-btn"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            run(action.id, item);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
