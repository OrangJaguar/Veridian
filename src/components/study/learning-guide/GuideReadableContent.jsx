import LatexRenderer from '@/components/shared/LatexRenderer';
import GuideIllustration from '@/components/study/learning-guide/GuideIllustration';
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
  sectionIndex,
  activeKey,
  onSegmentClick,
}) {
  const { first, second } = splitExplanationHalves(section.explanation);
  const artA = sectionIndex * 2;
  const artB = sectionIndex * 2 + 1;

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
          <div className="guide-zigzag-art" aria-hidden="true">
            <GuideIllustration index={artA} />
          </div>
        </div>

        {second.length > 0 && (
          <div className="guide-zigzag-row guide-zigzag-row--flip">
            <div className="guide-zigzag-art" aria-hidden="true">
              <GuideIllustration index={artB} />
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
