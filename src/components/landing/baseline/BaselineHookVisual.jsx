export default function BaselineHookVisual() {
  return (
    <div className="baseline-hook-visual" aria-hidden="true">
      <div className="baseline-hook-visual-card baseline-hook-visual-card--feels">
        <span className="baseline-hook-visual-label">Feels known</span>
        <div className="baseline-hook-visual-bars">
          <span style={{ width: '92%' }} />
          <span style={{ width: '88%' }} />
          <span style={{ width: '95%' }} />
        </div>
        <p>Recognition</p>
      </div>
      <div className="baseline-hook-visual-gap">
        <span className="baseline-hook-visual-gap-line" />
        <span className="baseline-hook-visual-gap-tag">Illusion</span>
      </div>
      <div className="baseline-hook-visual-card baseline-hook-visual-card--real">
        <span className="baseline-hook-visual-label">Actually known</span>
        <div className="baseline-hook-visual-bars">
          <span style={{ width: '34%' }} />
          <span style={{ width: '18%' }} />
          <span style={{ width: '41%' }} />
        </div>
        <p>Recall</p>
      </div>
    </div>
  );
}
