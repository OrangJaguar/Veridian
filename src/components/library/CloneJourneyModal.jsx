import { useState } from 'react';
import { useCloneJourney } from '@/hooks/mutations/useCloneJourney';

export default function CloneJourneyModal({
  journeyId,
  sourceTitle,
  modules,
  onClose,
}) {
  const clone = useCloneJourney();
  const [title, setTitle] = useState(`${sourceTitle} (copy)`);
  const [examDate, setExamDate] = useState('');
  const [selectedIds, setSelectedIds] = useState(modules.map((m) => m.moduleId));

  const toggleModule = (moduleId) => {
    setSelectedIds((prev) => (
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    ));
  };

  const handleClone = () => {
    if (!examDate) return;
    const examMs = new Date(`${examDate}T12:00:00`).getTime();
    clone.mutate({
      sourceJourneyId: journeyId,
      title: title.trim(),
      examDate: examMs,
      moduleIds: selectedIds,
    });
  };

  return (
    <div className="clone-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="clone-journey-modal"
        role="dialog"
        aria-labelledby="clone-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="clone-modal-title" className="clone-modal-title">Clone journey</h2>
        <p className="clone-modal-lead">
          Create your own copy with a fresh schedule and diagnostic. Your progress stays separate from the original.
        </p>

        <label className="veridian-form-field">
          Journey title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="veridian-form-field">
          Your exam date
          <input
            type="date"
            required
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
          />
        </label>

        <fieldset className="clone-module-fieldset">
          <legend>Modules to include</legend>
          {modules.map((mod) => (
            <label key={mod.moduleId} className="clone-module-check">
              <input
                type="checkbox"
                checked={selectedIds.includes(mod.moduleId)}
                onChange={() => toggleModule(mod.moduleId)}
              />
              <span>{mod.name}</span>
            </label>
          ))}
        </fieldset>

        <div className="clone-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={clone.isPending || !examDate || selectedIds.length === 0}
            onClick={handleClone}
          >
            {clone.isPending ? 'Cloning…' : 'Clone & start diagnostic'}
          </button>
        </div>
      </div>
    </div>
  );
}
