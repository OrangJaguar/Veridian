import LatexRenderer from '@/components/shared/LatexRenderer';
import GuideSidePanel from '@/components/study/learning-guide/GuideSidePanel';
import { resolveGuideSidePanels } from '@/utils/study/guideSidePanels';
import { splitExplanationHalves } from '@/utils/study/splitGuideExplanation';

function highlightClass(activeKey, key) {
  return activeKey === key ? ' guide-speak-active' : '';
}

function segmentProps(onSegmentClick, key) {
  if (!onSegmentClick) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick: () => onSegmentClick(key),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSegmentClick(key);
      }
    },
  };
}

function SentenceBlock({ sentences, startIndex, activeKey, onSegmentClick }) {
  if (!sentences.length) return null;
  return (
    <div className="guide-zigzag-text">
      {sentences.map((sentence, i) => {
        const idx = startIndex + i;
        const key = `exp-${idx}`;
        return (
          <p
            key={key}
            className={`guide-sentence${onSegmentClick ? ' guide-sentence--clickable' : ''}${highlightClass(activeKey, key)}`}
            {...segmentProps(onSegmentClick, key)}
          >
            <LatexRenderer text={sentence} />
          </p>
        );
      })}
    </div>
  );
}

export default function GuideReadableContent({
  section,
  activeKey,
  onSegmentClick,
}) {
  const { first, second } = splitExplanationHalves(section.explanation);
  const { keyTerms, takeaways } = resolveGuideSidePanels(section);

  return (
    <>
      <h1
        className={`guide-title${onSegmentClick ? ' guide-sentence--clickable' : ''}${highlightClass(activeKey, 'title')}`}
        {...segmentProps(onSegmentClick, 'title')}
      >
        {section.title}
      </h1>

      <div className="guide-zigzag">
        <div className="guide-zigzag-row">
          <SentenceBlock
            sentences={first}
            startIndex={0}
            activeKey={activeKey}
            onSegmentClick={onSegmentClick}
          />
          <div className="guide-zigzag-aside">
            <GuideSidePanel variant="terms" keyTerms={keyTerms} />
          </div>
        </div>

        {second.length > 0 && (
          <div className="guide-zigzag-row guide-zigzag-row--flip">
            <div className="guide-zigzag-aside">
              <GuideSidePanel variant="takeaways" takeaways={takeaways} />
            </div>
            <SentenceBlock
              sentences={second}
              startIndex={first.length}
              activeKey={activeKey}
              onSegmentClick={onSegmentClick}
            />
          </div>
        )}
      </div>
    </>
  );
}
