import { useState, useEffect } from 'react';
import { GOVERNANCE_OPTIONS, POWER_OPTIONS, RECALL_QUESTION } from './baselineContent';
import { useBaselineTimer } from './useBaselineTimer';

export default function BaselineScreen4Recall({ onComplete, onMount }) {
  const [governance, setGovernance] = useState('');
  const [power, setPower] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    onMount?.();
  }, [onMount]);

  const handleExpire = () => {
    if (!submitted) {
      setSubmitted(true);
      onComplete({ governance, power, timedOut: true });
    }
  };

  const { secondsLeft, progress, expired } = useBaselineTimer(true, handleExpire);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitted || expired) return;
    setSubmitted(true);
    onComplete({ governance, power, timedOut: false });
  };

  const secs = Math.ceil(secondsLeft);

  return (
    <>
      <div className="baseline-timer" aria-live="polite">
        <div className="baseline-timer-track">
          <div
            className="baseline-timer-fill"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <span className="baseline-timer-label">{secs}s</span>
      </div>
      <p className="baseline-question">{RECALL_QUESTION}</p>
      <form className="baseline-recall-form" onSubmit={handleSubmit}>
        <p className="baseline-recall-sentence">
          Governance will:{' '}
          <select
            className="baseline-recall-select"
            value={governance}
            onChange={(e) => setGovernance(e.target.value)}
            disabled={submitted || expired}
            required
          >
            <option value="">Select…</option>
            {GOVERNANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </p>
        <p className="baseline-recall-sentence">
          Power transfers to the:{' '}
          <select
            className="baseline-recall-select"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            disabled={submitted || expired}
            required
          >
            <option value="">Select…</option>
            {POWER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </p>
        <button
          type="submit"
          className="btn btn-primary baseline-cta"
          disabled={submitted || expired || !governance || !power}
        >
          Submit
        </button>
      </form>
    </>
  );
}
