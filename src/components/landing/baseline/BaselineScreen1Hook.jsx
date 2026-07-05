import BaselineHookVisual from './BaselineHookVisual';

export default function BaselineScreen1Hook({ onStart, onSkip }) {
  return (
    <div className="baseline-hook">
      <BaselineHookVisual />
      <h1 className="baseline-hook-title">Your brain lies to you about how much you know.</h1>
      <p className="baseline-hook-lead">
        You think you&apos;re bad at studying. You&apos;re actually just optimizing for the wrong type of memory. Let us prove it to you in 30 seconds.
      </p>
      <button type="button" className="btn btn-primary baseline-cta" onClick={onStart}>
        Start the 30-Second Baseline
      </button>
      <button type="button" className="baseline-skip-link" onClick={onSkip}>
        Skip to see how Veridian works
      </button>
    </div>
  );
}
