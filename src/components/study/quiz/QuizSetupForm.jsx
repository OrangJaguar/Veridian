import { useState } from 'react';

const FOCUS_PRESETS = [
  { id: 'fullReview', label: 'Full Review' },
  { id: 'weakSpots', label: 'Weak Spots' },
  { id: 'newMaterial', label: 'New Material' },
];

export default function QuizSetupForm({ defaultConfig = {}, onStart, loading }) {
  const [questionCount, setQuestionCount] = useState(defaultConfig.questionCount ?? 10);
  const [focusPreset, setFocusPreset] = useState(defaultConfig.focusPreset ?? 'weakSpots');
  const [timedMode, setTimedMode] = useState(defaultConfig.timedMode ?? false);

  return (
    <form
      className="study-setup-form"
      onSubmit={(e) => {
        e.preventDefault();
        onStart({ questionCount: Number(questionCount), focusPreset, timedMode, timeLimitMinutes: null });
      }}
    >
      <h2 className="study-setup-title">Quiz setup</h2>

      <label className="study-setup-field">
        Question count
        <select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </label>

      <fieldset className="study-setup-field">
        <legend>Focus</legend>
        {FOCUS_PRESETS.map((p) => (
          <label key={p.id} className="study-setup-radio">
            <input
              type="radio"
              name="focus"
              checked={focusPreset === p.id}
              onChange={() => setFocusPreset(p.id)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      <label className="study-setup-check">
        <input type="checkbox" checked={timedMode} onChange={(e) => setTimedMode(e.target.checked)} />
        Timed mode
      </label>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Generating…' : 'Start'}
      </button>
    </form>
  );
}
