import { Link } from 'react-router-dom';
import { trackProductEvent } from '@/lib/analytics';
import { clearBaseline } from '@/lib/baselineStorage';

const VALUE_PROPS = [
  { title: 'Know what to do next', desc: 'One daily queue — no guessing' },
  { title: 'Train real recall', desc: 'Not just recognition on flashcards' },
  { title: 'Built for your exam', desc: 'Your material, your date, your gaps' },
];

function handleRedoBaseline() {
  clearBaseline();
  window.location.assign('/');
}

export default function LandingFinalCta() {
  return (
    <section className="landing-section landing-closing">
      <div className="landing-section-inner">
        <div className="landing-closing-card">
          <div className="landing-closing-glow" aria-hidden="true" />
          <div className="landing-closing-content">
            <p className="landing-closing-eyebrow">Start with clarity</p>
            <h2 className="landing-section-title landing-closing-title">
              Built for the students who don&apos;t have time to study how to study.
            </h2>
            <ul className="landing-closing-props">
              {VALUE_PROPS.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </li>
              ))}
            </ul>
            <div className="landing-cta-row landing-closing-cta">
              <Link
                to="/signup"
                className="btn btn-primary"
                onClick={() => trackProductEvent('signup_click')}
              >
                Create Free Account
              </Link>
              <button
                type="button"
                className="btn landing-closing-redo"
                onClick={handleRedoBaseline}
              >
                Redo test
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
