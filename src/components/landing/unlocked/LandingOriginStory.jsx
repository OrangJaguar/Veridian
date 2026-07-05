import LandingOriginVisual from './LandingOriginVisual';

export default function LandingOriginStory() {
  return (
    <section className="landing-section landing-origin-section">
      <div className="landing-section-inner landing-split-block landing-split-visual-left landing-split-block--balanced">
        <LandingOriginVisual />
        <div className="landing-split-copy">
          <h2 className="landing-section-title landing-section-title-left">Why this exists.</h2>
          <p className="landing-section-lead landing-section-lead-left landing-origin-lead">
            I built Veridian because nothing told me whether studying was actually working until the grade was already on the paper.
          </p>
          <div className="landing-origin-story">
            <p>
              Sophomore year I walked into AP Chemistry, AP US History, and AP Psychology on the same schedule and realized for the first time that I had no idea how to actually study. Not in a &ldquo;I&apos;m lazy&rdquo; way — I&apos;d just never had to before. A quick review the night before a test was always enough. Nobody told me that was going to stop working until it already had.
            </p>
            <p>
              I tried everything. Re-reading notes felt like going through the motions. YouTube videos felt productive right up until I closed the tab and remembered nothing. Nothing told me whether what I was doing was actually working until the test came back with a number on it, and by then it was too late to change anything.
            </p>
            <p>
              I looked for something better. What I found were tools built for students who already knew how to study. None of them knew my material, my exam date, or which concepts I genuinely didn&apos;t understand versus which ones just needed one more pass. So eventually I just built the thing myself. That&apos;s Veridian.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
