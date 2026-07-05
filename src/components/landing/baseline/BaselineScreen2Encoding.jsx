import { DRAVIAN_PRINCIPLE_TEXT } from './baselineContent';
import BaselineDravianGraphic from './BaselineDravianGraphic';

const DRAVIAN_PARAGRAPHS = DRAVIAN_PRINCIPLE_TEXT.trim()
  .replace(/^"|"$/g, '')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);

export default function BaselineScreen2Encoding({ onReady }) {
  return (
    <div className="baseline-encoding">
      <h2 className="baseline-card-title">
        Read this made-up rule thoroughly. Click &apos;Next&apos; when you feel ready to be tested.
      </h2>
      <div className="baseline-encoding-layout">
        <div className="baseline-encoding-readbox">
          <p className="baseline-encoding-readbox-label">The Dravian Principle</p>
          {DRAVIAN_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph} className="baseline-encoding-readbox-text">
              {paragraph}
            </p>
          ))}
        </div>
        <BaselineDravianGraphic />
      </div>
      <button type="button" className="btn btn-primary baseline-cta" onClick={onReady}>
        I&apos;m Ready
      </button>
    </div>
  );
}
