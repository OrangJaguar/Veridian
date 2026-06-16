import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChoicePresetButton } from '@/components/shared/ChoiceControl';
import { getModuleQuizAccuracy } from '@/utils/weeklyPlan/moduleContext';
import { QUIZ_ACCURACY_NEEDS_WORK } from '@/utils/weeklyPlan/constants';
import { cramEligibleModules } from '@/utils/study/journeyUnlock';

const TIME_PRESETS = [5, 15, 30];

function defaultSelectedIds(eligible, activities) {
  const weak = eligible
    .filter((m) => {
      const acc = getModuleQuizAccuracy(m.moduleId, activities);
      return acc != null && acc < QUIZ_ACCURACY_NEEDS_WORK;
    })
    .map((m) => m.moduleId);
  if (weak.length >= 2) return weak.slice(0, Math.max(2, weak.length));
  return eligible.map((m) => m.moduleId);
}

export default function CramSessionSetupModal({
  open,
  modules = [],
  activities = [],
  journey,
  onClose,
  onStart,
  loading,
}) {
  const eligible = useMemo(() => cramEligibleModules(modules), [modules]);
  const [durationMin, setDurationMin] = useState(15);
  const [useCustom, setUseCustom] = useState(false);
  const [customMin, setCustomMin] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => defaultSelectedIds(eligible, activities));

  if (!open) return null;

  const resolvedMin = useCustom
    ? Math.min(60, Math.max(1, Number(customMin) || 15))
    : durationMin;

  const toggleModule = (moduleId) => {
    setSelectedIds((prev) => (
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    ));
  };

  const daysUntilExam = journey?.examDate
    ? Math.ceil((journey.examDate - Date.now()) / 86400000)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    onStart({
      durationMin: resolvedMin,
      selectedModuleIds: selectedIds,
    });
  };

  return createPortal(
    <div className="study-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="study-modal study-quiz-setup-modal cram-setup-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="cram-setup-title"
      >
        <div className="study-modal-header">
          <h2 id="cram-setup-title" className="study-modal-title">Cram Session</h2>
          <button type="button" className="study-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {daysUntilExam != null && daysUntilExam > 0 && (
          <p className="journey-challenge-exam-hint">
            Exam in {daysUntilExam} day{daysUntilExam === 1 ? '' : 's'}
          </p>
        )}

        <form className="study-modal-body" onSubmit={handleSubmit}>
          <div className="study-setup-section">
            <span className="study-setup-label">Time</span>
            <div className="study-setup-presets">
              {TIME_PRESETS.map((n) => (
                <ChoicePresetButton
                  key={n}
                  selected={!useCustom && durationMin === n}
                  onClick={() => { setUseCustom(false); setDurationMin(n); }}
                >
                  {n} min
                </ChoicePresetButton>
              ))}
              <ChoicePresetButton selected={useCustom} onClick={() => setUseCustom(true)}>
                Custom
              </ChoicePresetButton>
            </div>
            {useCustom && (
              <input
                type="number"
                className="study-setup-custom-input"
                min={1}
                max={60}
                placeholder="Minutes"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
              />
            )}
          </div>

          <div className="study-setup-section">
            <span className="study-setup-label">Modules</span>
            <div className="cram-module-chips">
              {eligible.map((m) => (
                <button
                  key={m.moduleId}
                  type="button"
                  className={`onboarding-chip${selectedIds.includes(m.moduleId) ? ' selected' : ''}`}
                  onClick={() => toggleModule(m.moduleId)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="study-modal-footer">
            <button
              type="submit"
              className="btn btn-primary study-modal-start"
              disabled={loading || selectedIds.length === 0}
            >
              {loading ? 'Loading…' : 'Start Cram'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
