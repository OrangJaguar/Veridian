import { useState, useEffect, useMemo } from 'react';
import { Volume2, VolumeX, ExternalLink } from 'lucide-react';
import VeridianLoading from '@/components/shared/VeridianLoading';
import LatexRenderer from '@/components/shared/LatexRenderer';
import GuideSectionPicker from '@/components/study/learning-guide/GuideSectionPicker';
import GuideReadableContent from '@/components/study/learning-guide/GuideReadableContent';
import GuideWorkedExample from '@/components/study/learning-guide/GuideWorkedExample';
import LearningGuideCheckIn from '@/components/study/learning-guide/LearningGuideCheckIn';
import { buildSectionSpeechPlan } from '@/utils/study/guideSpeech';
import { useGuideNarration } from '@/hooks/study/useGuideNarration';

export default function LearningGuideViewer({
  sections = [],
  completedIds = [],
  onSectionComplete,
  onFinish,
  onExit,
}) {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [checkInBySection, setCheckInBySection] = useState({});

  const section = sections[sectionIndex];
  const total = sections.length;
  const progressPct = total ? ((sectionIndex + 1) / total) * 100 : 0;
  const checkInDone = !section?.checkInQuestion || checkInBySection[section?.sectionId] != null;
  const isLast = sectionIndex + 1 >= total;

  const speechPlan = useMemo(
    () => buildSectionSpeechPlan(section),
    [section],
  );
  const { speaking, activeKey, toggle: toggleSpeech, stop: stopSpeech } = useGuideNarration(speechPlan);

  useEffect(() => {
    stopSpeech();
  }, [sectionIndex, stopSpeech]);

  const handleCheckIn = (result) => {
    if (!section) return;
    setCheckInBySection((prev) => ({
      ...prev,
      [section.sectionId]: result,
    }));
  };

  const jumpToSection = (i) => {
    setSectionIndex(i);
  };

  const handleContinue = () => {
    if (!section || !checkInDone) return;
    const nextCompleted = [...new Set([...completedIds, section.sectionId])];
    onSectionComplete?.(section.sectionId);
    if (isLast) {
      onFinish?.({
        checkInResults: checkInBySection,
        completedSectionIds: nextCompleted,
      });
      return;
    }
    setSectionIndex(sectionIndex + 1);
    window.scrollTo(0, 0);
    document.querySelector('.guide-scroll')?.scrollTo(0, 0);
  };

  if (!section) {
    return (
      <div className="study-mode-view guide-mode-view">
        <VeridianLoading fullPage />
      </div>
    );
  }

  return (
    <div className="study-mode-view guide-mode-view">
      <header className="guide-header">
        <button type="button" className="util-btn exit-btn" onClick={onExit}>
          Exit
        </button>

        <div className="guide-header-center">
          <span className="guide-progress-pct">{Math.round(progressPct)}%</span>
          <div className="progress-bar guide-progress-bar">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <GuideSectionPicker
            open={navOpen}
            onToggle={setNavOpen}
            sections={sections}
            currentIndex={sectionIndex}
            completedIds={completedIds}
            onJump={jumpToSection}
          />
        </div>

        <button
          type="button"
          className={`guide-listen-btn${speaking ? ' active' : ''}`}
          onClick={toggleSpeech}
          disabled={speechPlan.length === 0}
          aria-label={speaking ? 'Stop narration' : 'Read this section aloud'}
        >
          {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </header>

      <main className="guide-scroll">
        <GuideReadableContent
          section={section}
          sectionIndex={sectionIndex}
          activeKey={activeKey}
        />

        {section.workedExamples?.[0] && (
          <GuideWorkedExample
            example={section.workedExamples[0]}
            exampleIndex={0}
            activeKey={activeKey}
          />
        )}

        {section.checkInQuestion && (
          <LearningGuideCheckIn
            key={section.sectionId}
            checkIn={section.checkInQuestion}
            onAnswered={handleCheckIn}
          />
        )}

        {section.externalSearchSuggestions?.length > 0 && (
          <section className="guide-youtube" aria-labelledby="guide-youtube-heading">
            <h3 id="guide-youtube-heading" className="guide-youtube-title">
              Watch on YouTube
            </h3>
            <p className="guide-youtube-desc">
              New to this topic? These searches find beginner-friendly explainers.
            </p>
            <div className="guide-youtube-chips">
              {section.externalSearchSuggestions.map((q) => (
                <a
                  key={q}
                  className="guide-youtube-chip"
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {q}
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        )}

        {section.transitionText && (
          <p className="guide-transition">
            <LatexRenderer text={section.transitionText} />
          </p>
        )}

        <div className="guide-end-actions">
          <p className="guide-end-hint">
            {!checkInDone ? 'Answer the check-in to continue' : '\u00A0'}
          </p>
          <button
            type="button"
            className="btn btn-primary guide-continue-btn"
            disabled={!checkInDone}
            onClick={handleContinue}
          >
            {isLast ? 'Finish guide' : 'Continue'}
          </button>
        </div>
      </main>
    </div>
  );
}
