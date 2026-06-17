import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { submitFeedback } from '@/api/feedback/submitFeedback';
import { Bug, Lightbulb, MessageCircle, Check } from 'lucide-react';

const TYPES = [
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Something broke or behaved unexpectedly.',
    icon: Bug,
    placeholder: 'What happened? Steps to reproduce help us fix it faster.',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'An idea for how Veridian could work better.',
    icon: Lightbulb,
    placeholder: 'What would you like Veridian to do differently or better?',
  },
  {
    id: 'general',
    label: 'General Feedback',
    description: 'Anything else on your mind.',
    icon: MessageCircle,
    placeholder: 'Share anything on your mind about Veridian.',
  },
];

const STEPS = ['typeSelect', 'message', 'optionalEmail', 'submitted'];

export default function FeedbackWizard() {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [replyEmail, setReplyEmail] = useState(user?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const step = STEPS[stepIndex];
  const typeConfig = TYPES.find((t) => t.id === type);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await submitFeedback({ type, message, replyEmail });
      setStepIndex(STEPS.indexOf('submitted'));
    } catch (err) {
      setError(err?.message ?? 'Could not send feedback. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="feedback-wizard-panel">
      <div className={`feedback-step feedback-step-${step}`}>
        {step === 'typeSelect' ? (
          <>
            <div className="feedback-step-head">
              <h2 className="feedback-step-title">What kind of feedback?</h2>
              <p className="feedback-step-lead">Choose the option that best fits.</p>
            </div>
            <div className="feedback-type-grid">
              {TYPES.map(({ id, label, description, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="feedback-type-card"
                  onClick={() => {
                    setType(id);
                    setStepIndex(1);
                  }}
                >
                  <span className="feedback-type-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <span className="feedback-type-label">{label}</span>
                  <span className="feedback-type-desc">{description}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 'message' ? (
          <>
            <div className="feedback-step-head">
              <h2 className="feedback-step-title">Tell us more</h2>
              <p className="feedback-step-lead">
                {typeConfig?.label ?? 'Feedback'} — share as much detail as you like.
              </p>
            </div>
            <textarea
              className="veridian-textarea feedback-textarea"
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={typeConfig?.placeholder}
              autoFocus
            />
            <div className="feedback-actions">
              <button type="button" className="veridian-btn veridian-btn-ghost" onClick={() => setStepIndex(0)}>Back</button>
              <button
                type="button"
                className="veridian-btn veridian-btn-primary"
                disabled={message.trim().length < 10}
                onClick={() => setStepIndex(2)}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {step === 'optionalEmail' ? (
          <>
            <div className="feedback-step-head">
              <h2 className="feedback-step-title">Want a reply?</h2>
              <p className="feedback-step-lead">
                Optional — leave your email if you&apos;d like us to follow up.
              </p>
            </div>
            <div className="feedback-email-field">
              <input
                type="email"
                className="veridian-input feedback-email-input"
                value={replyEmail}
                onChange={(e) => setReplyEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
              />
            </div>
            {error ? <p className="feedback-error">{error}</p> : null}
            <div className="feedback-actions">
              <button type="button" className="veridian-btn veridian-btn-ghost" onClick={() => setStepIndex(1)}>Back</button>
              <button
                type="button"
                className="veridian-btn veridian-btn-primary"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </>
        ) : null}

        {step === 'submitted' ? (
          <div className="feedback-done">
            <span className="feedback-done-icon" aria-hidden="true"><Check size={28} /></span>
            <h2 className="feedback-step-title">Got it.</h2>
            <p className="feedback-step-lead">We read every single one.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
