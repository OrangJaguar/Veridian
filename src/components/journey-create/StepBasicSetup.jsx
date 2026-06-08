import { useJourneyCreateStore } from '@/store/journeyCreateStore';

const PRIOR_OPTIONS = [
  { value: 'scratch', label: 'Starting from scratch' },
  { value: 'some', label: 'Some familiarity' },
  { value: 'most', label: 'Mostly familiar' },
];

export default function StepBasicSetup({ onNext }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const updateDraft = useJourneyCreateStore((s) => s.updateDraft);

  const canNext = draft.title.trim().length >= 2 && draft.subject.trim().length >= 2;

  return (
    <div className="create-step">
      <h2 className="create-step-title">Name and deadline</h2>
      <p className="create-step-desc">Tell Veridian what you&apos;re studying and when your exam is.</p>

      <label className="create-field">
        <span>Journey title</span>
        <input
          type="text"
          value={draft.title}
          placeholder="e.g. AP Chemistry, MCAT Biochemistry"
          onChange={(e) => updateDraft({ title: e.target.value })}
        />
      </label>

      <label className="create-field">
        <span>Subject</span>
        <input
          type="text"
          value={draft.subject}
          placeholder="e.g. Chemistry"
          onChange={(e) => updateDraft({ subject: e.target.value })}
        />
      </label>

      <label className="create-field">
        <span>Exam date (optional)</span>
        <input
          type="date"
          value={draft.examDate ? new Date(draft.examDate).toISOString().slice(0, 10) : ''}
          onChange={(e) => {
            const val = e.target.value;
            updateDraft({
              examDate: val ? new Date(`${val}T12:00:00`).getTime() : null,
            });
          }}
        />
        <button
          type="button"
          className="create-link-btn"
          onClick={() => updateDraft({ examDate: null })}
        >
          Skip for now
        </button>
      </label>

      <fieldset className="create-field">
        <legend>Prior knowledge</legend>
        {PRIOR_OPTIONS.map((opt) => (
          <label key={opt.value} className="create-radio">
            <input
              type="radio"
              name="priorKnowledge"
              value={opt.value}
              checked={draft.priorKnowledge === opt.value}
              onChange={() => updateDraft({ priorKnowledge: opt.value })}
            />
            {opt.label}
          </label>
        ))}
      </fieldset>

      <div className="create-step-actions">
        <button type="button" className="btn btn-primary" disabled={!canNext} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
