import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChoicePresetButton } from '@/components/shared/ChoiceControl';
import { formatStudyTime } from '@/utils/study/feedback';
import { getModuleQuizAccuracy } from '@/utils/weeklyPlan/moduleContext';
import {
  computeModuleQuestionCounts,
  formatDistributionPreview,
} from '@/utils/study/challengeDistribution';

const COUNT_PRESETS = [25, 50];
const TIME_OPTIONS = [
  { seconds: 30, label: '30s per question' },
  { seconds: 60, label: '1m per question', recommended: true },
  { seconds: 120, label: '2m per question' },
];

export default function JourneyChallengeSetupModal({
  open,
  modules = [],
  activities = [],
  journey,
  onClose,
  onStart,
  loading,
}) {
  const [questionCount, setQuestionCount] = useState(25);
  const [useCustom, setUseCustom] = useState(false);
  const [customCount, setCustomCount] = useState('');
  const [focusWeight, setFocusWeight] = useState(0.5);
  const [strictSecondsPerQuestion, setStrictSecondsPerQuestion] = useState(60);

  const quizAccuracyByModule = useMemo(() => {
    const map = {};
    for (const m of modules) {
      map[m.moduleId] = getModuleQuizAccuracy(m.moduleId, activities);
    }
    return map;
  }, [modules, activities]);

  if (!open) return null;

  const resolvedCount = useCustom
    ? Math.min(100, Math.max(1, Number(customCount) || 25))
    : questionCount;

  const distribution = computeModuleQuestionCounts(
    modules,
    quizAccuracyByModule,
    resolvedCount,
    focusWeight,
  );
  const previewText = formatDistributionPreview(distribution);

  const daysUntilExam = journey?.examDate
    ? Math.ceil((journey.examDate - Date.now()) / 86400000)
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({
      questionCount: resolvedCount,
      focusWeight,
      strictSecondsPerQuestion,
      strictMode: true,
      moduleDistributionPreview: distribution,
      moduleTargets: distribution.map((d) => ({ moduleId: d.moduleId, count: d.count })),
    });
  };

  return createPortal(
    <div className="study-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="study-modal study-quiz-setup-modal journey-challenge-setup-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="challenge-setup-title"
      >
        <div className="study-modal-header">
          <h2 id="challenge-setup-title" className="study-modal-title">Journey Challenge</h2>
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
            <span className="study-setup-label">Questions</span>
            <div className="study-setup-presets">
              {COUNT_PRESETS.map((n) => (
                <ChoicePresetButton
                  key={n}
                  selected={!useCustom && questionCount === n}
                  onClick={() => { setUseCustom(false); setQuestionCount(n); }}
                >
                  {n}
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
                max={100}
                placeholder="Enter count"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
              />
            )}
          </div>

          <div className="study-setup-section focus-dial-section">
            <div className="focus-dial-header">
              <span className="study-setup-label">Focus</span>
              <span className="focus-dial-labels">
                <span>Balanced</span>
                <span>Weak Spots</span>
              </span>
            </div>
            <input
              type="range"
              className="focus-dial"
              min={0}
              max={100}
              value={Math.round(focusWeight * 100)}
              onChange={(e) => setFocusWeight(Number(e.target.value) / 100)}
            />
            {previewText && (
              <p className="focus-dial-preview">{previewText}</p>
            )}
          </div>

          <div className="study-setup-section">
            <span className="study-setup-label">Time per question (strict mode)</span>
            <div className="study-setup-choices">
              {TIME_OPTIONS.map((opt) => {
                const totalSec = resolvedCount * opt.seconds;
                return (
                  <label key={opt.seconds} className="settings-radio">
                    <input
                      type="radio"
                      name="challenge-time"
                      checked={strictSecondsPerQuestion === opt.seconds}
                      onChange={() => setStrictSecondsPerQuestion(opt.seconds)}
                    />
                    <span>
                      {opt.label}
                      {opt.recommended ? ' (recommended)' : ''}
                      {' — '}
                      {formatStudyTime(totalSec)} total
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="study-modal-footer">
            <button type="submit" className="btn btn-primary study-modal-start" disabled={loading}>
              {loading ? 'Loading…' : 'Start Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
