import { useState } from 'react';
import {
  MAI_ITEMS,
  MAI_SCALE_MIN,
  MAI_SCALE_MAX,
  MAI_SCALE_LABELS,
} from '@/lib/survey/maiItems';

export default function MaiSurveyWizard({
  onSubmit,
  onSkip,
  submitting = false,
  title = 'Quick self-check',
}) {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState(() => MAI_ITEMS.map((_, i) => ({
    questionIndex: i,
    response: null,
  })));

  const current = responses[step];
  const allAnswered = responses.every((r) => r.response != null);

  const setResponse = (value) => {
    setResponses((prev) => prev.map((r, i) => (
      i === step ? { ...r, response: value } : r
    )));
  };

  const handleNext = () => {
    if (step < MAI_ITEMS.length - 1) {
      setStep(step + 1);
      return;
    }
    if (allAnswered) onSubmit(responses);
  };

  return (
    <div className="mai-survey-wizard">
      <header className="mai-survey-header">
        <h1 className="mai-survey-title">{title}</h1>
        <p className="mai-survey-subtitle">
          Rate how much each statement is like you (1–5).
        </p>
        <div className="mai-survey-progress">
          Question {step + 1} of {MAI_ITEMS.length}
        </div>
      </header>

      <p className="mai-survey-question">{MAI_ITEMS[step]}</p>

      <div className="mai-survey-scale" role="group" aria-label="Likert scale">
        {Array.from({ length: MAI_SCALE_MAX - MAI_SCALE_MIN + 1 }, (_, i) => {
          const value = MAI_SCALE_MIN + i;
          return (
            <button
              key={value}
              type="button"
              className={`mai-scale-btn${current.response === value ? ' is-selected' : ''}`}
              onClick={() => setResponse(value)}
              disabled={submitting}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="mai-survey-scale-labels">
        <span>{MAI_SCALE_LABELS.min}</span>
        <span>{MAI_SCALE_LABELS.max}</span>
      </div>

      <div className="mai-survey-actions">
        {step > 0 && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={current.response == null || submitting}
          onClick={handleNext}
        >
          {step < MAI_ITEMS.length - 1 ? 'Next' : (submitting ? 'Saving…' : 'Submit')}
        </button>
      </div>

      {onSkip && (
        <button type="button" className="mai-survey-skip" onClick={onSkip} disabled={submitting}>
          Skip for now
        </button>
      )}
    </div>
  );
}
