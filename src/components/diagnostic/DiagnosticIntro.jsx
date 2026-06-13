export default function DiagnosticIntro({
  journeyTitle,
  moduleCount,
  questionCount,
  onStart,
  onSkip,
  loading,
  skipping,
}) {
  return (
    <div className="diagnostic-intro create-step">
      <h2 className="create-step-title">Diagnostic assessment</h2>
      <p className="create-step-desc">
        Before you start studying
        {journeyTitle ? ` ${journeyTitle}` : ''}
        , answer a short assessment so Veridian can place each module at the right stage.
      </p>

      <ul className="diagnostic-intro-points">
        <li>
          <strong>{questionCount} questions</strong>
          {' '}
          across
          {' '}
          <strong>{moduleCount} modules</strong>
          {' '}
          (3 per module)
        </li>
        <li>Questions are designed to test real understanding — not lucky guesses</li>
        <li>No time limit — take as long as you need</li>
        <li>Results shown at the end; modules with 3/3 correct skip to Stage B practice</li>
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
          {loading ? 'Generating questions…' : 'Start diagnostic'}
        </button>
      </div>
    </div>
  );
}
