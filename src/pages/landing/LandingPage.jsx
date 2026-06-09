import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingScrollProgress from '@/components/landing/LandingScrollProgress';
import LandingCursorGlow from '@/components/landing/LandingCursorGlow';
import LandingGapCompare from '@/components/landing/LandingGapCompare';
import LandingInteractiveModes from '@/components/landing/LandingInteractiveModes';
import {
  LandingHeroScene,
  LandingPipeline,
  LandingDueTodayDemo,
  LandingSRDiagram,
  LandingRoadmapTimeline,
  LandingJourneyTree,
} from '@/components/landing/LandingVisuals';

const STATS = [
  { value: 'Plan', label: 'Built in, not DIY' },
  { value: 'SR', label: 'Scheduled for you' },
  { value: 'Library', label: 'Start without notes' },
];

export default function LandingPage() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <LandingScrollProgress />
      <div className="landing-page">
        <LandingCursorGlow />
        <section className="landing-hero">
          <div className="landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">The missing piece in study apps</p>
              <h1 className="landing-headline">
                Tools are everywhere.<br />A real study plan isn&apos;t.
              </h1>
              <p className="landing-lead">
                Most apps give you flashcards, quizzes, and notes — then leave the hard part to you: figuring out <em>what</em> to study, <em>when</em>, and <em>in what order</em>. Veridian builds the Journey, calculates the schedule, and tells you exactly what is Due Today.
              </p>
              <div className="landing-cta-row">
                {!isLoading && user ? (
                  <>
                    <Link to="/home" className="btn btn-primary">Go to App</Link>
                    <button type="button" className="btn" onClick={handleLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-primary">Get Started</Link>
                    <Link to="/signin" className="btn">Sign in</Link>
                  </>
                )}
              </div>
              <Link to="/app" className="landing-guest-link">
                Continue without an account →
              </Link>
            </div>
            <LandingHeroScene />
          </div>
        </section>

        <section className="landing-section landing-section-problem">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">The gap</p>
            <h2 className="landing-section-title">Content is solved. Planning isn&apos;t.</h2>
            <p className="landing-section-lead">
              You can find study tools anywhere. What you cannot find is something that turns your material into a coherent path — and keeps you on it until the exam. That is what Veridian does.
            </p>
            <LandingGapCompare />
          </div>
        </section>

        <section className="landing-stats">
          {STATS.map(({ value, label }) => (
            <div key={label} className="landing-stat">
              <span className="landing-stat-value">{value}</span>
              <span className="landing-stat-label">{label}</span>
            </div>
          ))}
        </section>

        <section className="landing-section landing-section-pipeline">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">How it works</p>
            <h2 className="landing-section-title">One reliable pattern — start to finish</h2>
            <p className="landing-section-lead">
              Bring your notes, or start from the Community Library. Veridian structures everything into a Journey, schedules review automatically, and surfaces Due Today so you never wonder what to do next.
            </p>
            <LandingPipeline />
          </div>
        </section>

        <section className="landing-section landing-section-alt">
          <div className="landing-section-inner landing-split-block landing-split-visual-left">
            <LandingJourneyTree />
            <div className="landing-split-copy">
              <p className="landing-eyebrow">Structure, not chaos</p>
              <h2 className="landing-section-title landing-section-title-left">A Journey is your entire course — organized</h2>
              <p className="landing-section-lead landing-section-lead-left">
                No more scattered decks and random review. Each Journey breaks your subject into modules with a clear order, progress tracking, and activities generated from your actual material.
              </p>
              <ul className="landing-checklist">
                <li>Every module knows what comes next</li>
                <li>Progress visible at a glance</li>
                <li>Same content powers every study mode</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-due">
          <div className="landing-section-inner landing-split-block landing-split-visual-right">
            <div className="landing-split-copy">
              <p className="landing-eyebrow">Your daily answer</p>
              <h2 className="landing-section-title landing-section-title-left">Due Today — the plan, delivered</h2>
              <p className="landing-section-lead landing-section-lead-left">
                This is the core of Veridian. Not a wall of decks to pick from — a single, prioritized list of what will move the needle right now. Spaced repetition runs in the background. You open the app and study.
              </p>
            </div>
            <LandingDueTodayDemo />
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">Study modes</p>
            <h2 className="landing-section-title">Four ways in — one source of truth</h2>
            <p className="landing-section-lead">
              Quiz, flashcards, typing, summary — all from the same Journey. Click a mode below to see what it looks like.
            </p>
            <LandingInteractiveModes />
          </div>
        </section>

        <section className="landing-section landing-section-alt">
          <div className="landing-section-inner landing-split-block landing-split-visual-left">
            <LandingSRDiagram />
            <div className="landing-split-copy">
              <p className="landing-eyebrow">Spaced repetition</p>
              <h2 className="landing-section-title landing-section-title-left">The schedule is calculated — not guessed</h2>
              <p className="landing-section-lead landing-section-lead-left">
                Veridian reviews each topic right before you would forget it. Hover the curve to see how retention builds over time — this runs automatically on every Journey you create.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-library">
          <div className="landing-section-inner landing-callout">
            <p className="landing-eyebrow">No notes? No problem.</p>
            <h2 className="landing-section-title">Community Library — start from someone else&apos;s Journey</h2>
            <p className="landing-section-lead">
              Browse Journeys built by other students, preview modules, and clone one to your account. You do not need to upload a single document to start studying with a real plan.
            </p>
            <Link to="/library" className="btn btn-primary">Browse Community Library</Link>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-section-inner">
            <p className="landing-eyebrow">Roadmap</p>
            <h2 className="landing-section-title">Built in the open — here is what is next</h2>
            <p className="landing-section-lead">
              Veridian is actively in development. The study app works today; the full Journey platform is coming in phases — all toward one goal: you walking into the exam knowing you did the right work.
            </p>
            <LandingRoadmapTimeline />
          </div>
        </section>

        <section className="landing-section landing-closing">
          <div className="landing-closing-bg" aria-hidden="true" />
          <div className="landing-section-inner landing-section-inner-center">
            <h2 className="landing-section-title">Stop planning. Start studying.</h2>
            <p className="landing-section-lead">
              Create a free account to save Journeys across devices, explore the Community Library, or jump into the study app as a guest right now.
            </p>
            <div className="landing-cta-row">
              {!isLoading && user ? (
                <Link to="/home" className="btn btn-primary">Go to App</Link>
              ) : (
                <Link to="/signup" className="btn btn-primary">Get Started — it&apos;s free</Link>
              )}
              <Link to="/library" className="btn">Browse Library</Link>
              <Link to="/app" className="btn">Try as guest</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
