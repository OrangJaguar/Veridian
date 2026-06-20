import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChoiceRadio, ChoiceToggle, ChoicePresetButton } from '@/components/shared/ChoiceControl';
import { formatStudyTime } from '@/utils/study/feedback';

const FOCUS_PRESETS = [
  { id: 'fullReview', label: 'Full Review' },
  { id: 'weakSpots', label: 'Weak Spots' },
  { id: 'newMaterial', label: 'New Material' },
];

const COUNT_PRESETS = [10, 25, 50];

const STRICT_TIME_OPTIONS = [
  { seconds: 30, label: '30s per question' },
  { seconds: 60, label: '1m per question', recommended: true },
  { seconds: 120, label: '2m per question' },
];

export default function QuizSetupModal({ open, defaultConfig = {}, onClose, onStart, loading }) {
  const [questionCount, setQuestionCount] = useState(defaultConfig.questionCount ?? 10);
  const [customCount, setCustomCount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [focusPreset, setFocusPreset] = useState(defaultConfig.focusPreset ?? 'weakSpots');
  const [strictMode, setStrictMode] = useState(
    defaultConfig.strictMode ?? defaultConfig.strictTimedMode ?? false,
  );
  const [strictSecondsPerQuestion, setStrictSecondsPerQuestion] = useState(
    defaultConfig.strictSecondsPerQuestion ?? 60,
  );
  const [uiPreset, setUiPreset] = useState(defaultConfig.uiPreset ?? 'classic');
  const [questionStyle, setQuestionStyle] = useState(defaultConfig.questionStyle ?? 'standard');

  if (!open) return null;

  const resolvedCount = useCustom
    ? Math.min(100, Math.max(1, Number(customCount) || 10))
    : questionCount;

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({
      questionCount: resolvedCount,
      focusPreset,
      strictMode,
      strictTimedMode: strictMode,
      strictSecondsPerQuestion: strictMode ? strictSecondsPerQuestion : null,
      instantFeedback: !strictMode,
      uiPreset,
      questionStyle,
    });
  };

  return createPortal(
    <div className="study-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="study-modal study-quiz-setup-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="quiz-setup-title"
      >
        <div className="study-modal-header">
          <h2 id="quiz-setup-title" className="study-modal-title">Quiz Setup</h2>
          <button type="button" className="study-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <form className="study-modal-body" onSubmit={handleSubmit}>
          <div className="study-setup-section">
            <span className="study-setup-label">Questions</span>
            <div className="study-setup-presets">
              {COUNT_PRESETS.map((n) => (
                <ChoicePresetButton
                  key={n}
                  selected={!useCustom && questionCount === n}
                  onClick={() => {
                    setUseCustom(false);
                    setQuestionCount(n);
                  }}
                >
                  {n}
                </ChoicePresetButton>
              ))}
              <ChoicePresetButton
                selected={useCustom}
                onClick={() => setUseCustom(true)}
              >
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

          <fieldset className="study-setup-section study-setup-fieldset">
            <legend className="study-setup-label">Focus</legend>
            <div className="study-setup-choices">
              {FOCUS_PRESETS.map((p) => (
                <ChoiceRadio
                  key={p.id}
                  name="quiz-focus"
                  value={p.id}
                  label={p.label}
                  checked={focusPreset === p.id}
                  onChange={setFocusPreset}
                />
              ))}
            </div>
          </fieldset>

          <div className="study-setup-section study-setup-strict-block">
            <ChoiceToggle
              label="Strict Mode"
              description="Countdown for the whole quiz — auto-submits when time is up. Results shown at the end."
              checked={strictMode}
              onChange={setStrictMode}
            />
            {strictMode && (
              <div className="study-setup-strict-options">
                {STRICT_TIME_OPTIONS.map((opt) => {
                  const totalSec = resolvedCount * opt.seconds;
                  return (
                    <ChoiceRadio
                      key={opt.seconds}
                      name="strict-time"
                      value={String(opt.seconds)}
                      label={`${opt.label}${opt.recommended ? ' (recommended)' : ''} — ${formatStudyTime(totalSec)} total`}
                      checked={strictSecondsPerQuestion === opt.seconds}
                      onChange={(val) => setStrictSecondsPerQuestion(Number(val))}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="study-setup-section">
            <label className="study-setup-label" htmlFor="quiz-ui-preset">Quiz interface</label>
            <select
              id="quiz-ui-preset"
              className="study-setup-select"
              value={uiPreset}
              onChange={(e) => setUiPreset(e.target.value)}
            >
              <option value="classic">Classic</option>
              <option value="apClassroom">AP Classroom</option>
            </select>
          </div>

          <div className="study-setup-section">
            <label className="study-setup-label" htmlFor="quiz-question-style">Question style</label>
            <select
              id="quiz-question-style"
              className="study-setup-select"
              value={questionStyle}
              onChange={(e) => setQuestionStyle(e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="apStyle">AP Style</option>
            </select>
          </div>

          <div className="study-modal-footer">
            <button type="submit" className="btn btn-primary study-modal-start" disabled={loading}>
              {loading ? 'Loading…' : 'Start Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
