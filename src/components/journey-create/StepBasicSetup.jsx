import { useState } from 'react';
import { useJourneyCreateStore } from '@/store/journeyCreateStore';
import { ChoiceRadio } from '@/components/shared/ChoiceControl';
import LibraryTagPicker from '@/components/library/LibraryTagPicker';
import { JOURNEY_SUBJECT_OPTIONS } from '@/lib/journeySubjects';
import {
  AuthFieldRules,
  buildJourneyTitleRules,
} from '@/components/auth/AuthFieldRules';
import { isValidJourneyTitle, normalizeJourneyTitle } from '@/utils/schemas/journeyTitle';
import { canAdvanceBasicSetup } from '@/utils/journey/canAdvanceBasicSetup';

const PRIOR_OPTIONS = [
  { value: 'scratch', label: 'Starting from scratch' },
  { value: 'some', label: 'Some familiarity' },
  { value: 'most', label: 'Mostly familiar' },
];

export default function StepBasicSetup({ onNext }) {
  const draft = useJourneyCreateStore((s) => s.draft);
  const updateDraft = useJourneyCreateStore((s) => s.updateDraft);
  const [titleFocused, setTitleFocused] = useState(false);
  const [hasExamDate, setHasExamDate] = useState(draft.examDate != null);

  const titleRules = buildJourneyTitleRules(draft.title, titleFocused);
  const showTitleRules = titleFocused || draft.title.length > 0;

  const canNext = canAdvanceBasicSetup(draft, { hasExamDate });

  const selectExamMode = (withExam) => {
    setHasExamDate(withExam);
    if (!withExam) {
      updateDraft({ examDate: null });
    }
  };

  return (
    <div className="create-step">
      <h2 className="create-step-title">Name and goal</h2>
      <p className="create-step-desc">
        Tell Veridian what you&apos;re studying — and set an exam date only if you have one.
      </p>

      <label className="create-field">
        <span>Journey title</span>
        <input
          type="text"
          value={draft.title}
          placeholder="e.g. AP Chemistry, MCAT Biochemistry"
          onChange={(e) => updateDraft({ title: e.target.value })}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => {
            setTitleFocused(false);
            updateDraft({ title: normalizeJourneyTitle(draft.title) });
          }}
        />
        {showTitleRules && (
          <AuthFieldRules rules={titleRules} columns={1} />
        )}
      </label>

      <label className="create-field">
        <span>Subject</span>
        <select
          className="create-field-select"
          value={draft.subject}
          onChange={(e) => updateDraft({ subject: e.target.value })}
        >
          <option value="">Select a subject…</option>
          {JOURNEY_SUBJECT_OPTIONS.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </label>

      <fieldset className="create-field create-fieldset">
        <legend className="create-fieldset-legend">Exam timeline</legend>
        <div className="create-choice-list">
          <ChoiceRadio
            name="examMode"
            value="exam"
            label="I have an exam date"
            checked={hasExamDate}
            onChange={() => selectExamMode(true)}
          />
          <ChoiceRadio
            name="examMode"
            value="open"
            label="Open learning — no exam"
            checked={!hasExamDate}
            onChange={() => selectExamMode(false)}
          />
        </div>
      </fieldset>

      {hasExamDate ? (
        <label className="create-field">
          <span>Exam date</span>
          <input
            type="date"
            required
            value={draft.examDate ? new Date(draft.examDate).toISOString().slice(0, 10) : ''}
            onChange={(e) => {
              const val = e.target.value;
              updateDraft({
                examDate: val ? new Date(`${val}T12:00:00`).getTime() : null,
              });
            }}
          />
        </label>
      ) : (
        <p className="create-step-hint">
          Without an exam, Veridian uses Keep sharp pacing (lighter, spaced practice).
        </p>
      )}

      <fieldset className="create-field create-fieldset">
        <legend className="create-fieldset-legend">Prior knowledge</legend>
        <div className="create-choice-list">
          {PRIOR_OPTIONS.map((opt) => (
            <ChoiceRadio
              key={opt.value}
              name="priorKnowledge"
              value={opt.value}
              label={opt.label}
              checked={draft.priorKnowledge === opt.value}
              onChange={(value) => updateDraft({ priorKnowledge: value })}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="create-field create-fieldset">
        <legend className="create-fieldset-legend">Visibility</legend>
        <div className="create-choice-list">
          <ChoiceRadio
            name="visibility"
            value="private"
            label="Private — only you can see this journey"
            checked={!draft.isPublic}
            onChange={() => updateDraft({ isPublic: false })}
          />
          <ChoiceRadio
            name="visibility"
            value="public"
            label="Public — share to Community Library after creation (requires tags & 3+ modules)"
            checked={draft.isPublic}
            onChange={() => updateDraft({ isPublic: true })}
          />
        </div>
      </fieldset>

      {draft.isPublic && (
        <div className="create-field">
          <span>Library tags</span>
          <LibraryTagPicker
            value={draft.tags}
            onChange={(tags) => updateDraft({ tags })}
          />
        </div>
      )}

      <div className="create-step-actions">
        <button type="button" className="btn btn-primary" disabled={!canNext} onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
