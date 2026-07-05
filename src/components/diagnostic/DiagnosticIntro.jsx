export default function DiagnosticIntro({
  journeyTitle,
  moduleCount,
  questionCount,
  onStart,
  onSkip,
  loading,
  skipping,
  moduleProgress,
}) {
  return (
    <div className="diagnostic-intro create-step">
      <h2 className="create-step-title">Before you study anything</h2>
      <p className="create-step-desc">
        Here&apos;s where you stand
        {journeyTitle ? ` — ${journeyTitle}` : ''}
        . This diagnostic maps how your knowledge holds up across recognition, application, and transfer — on your actual material.
      </p>

      <ul className="diagnostic-intro-points">
        <li>
          <strong>{questionCount} questions</strong>
          {' '}
          across
          {' '}
          <strong>{moduleCount} modules</strong>
          {' '}
          (3 per module: verbatim, application, transfer)
        </li>
        <li>Untimed — take as long as you need to think clearly</li>
        <li>A timed check-in comes later to measure exam pressure</li>
        <li>Results show exactly where your knowledge breaks down and what we target first</li>
      </ul>

      <div className="create-step-actions diagnostic-intro-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onSkip}
          disabled={loading || skipping}
        >
          {skipping ? 'Skipping…' : 'Skip for now'}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onStart}
          disabled={loading || skipping}
        >
          {loading
            ? (moduleProgress
              ? `Generating module ${moduleProgress.index} of ${moduleProgress.total}…`
              : 'Generating questions…')
            : 'Start diagnostic'}
        </button>
      </div>
    </div>
  );
}
