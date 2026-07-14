import { formatReasonCopy } from '@/utils/planner/reasonCopy';

export default function ModulePriorityList({ summaries = [] }) {
  if (!summaries.length) {
    return (
      <p className="module-priority-empty">No module priorities this week — keep your daily rhythm.</p>
    );
  }

  return (
    <ul className="module-priority-list">
      {summaries.map((s) => (
        <li key={s.moduleId} className="module-priority-item">
          <strong className="module-priority-name">{s.moduleName}</strong>
          <span className="module-priority-text">
            {s.reasonCode
              ? formatReasonCopy(s.reasonCode, { moduleName: s.moduleName })
              : s.priorityText}
          </span>
        </li>
      ))}
    </ul>
  );
}
