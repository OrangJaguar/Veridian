import { useState } from 'react';
import VeridianLogo from '@/components/layout/VeridianLogo';

/** 3D-tilted hero preview — responds to hover tilt */
export function LandingHeroScene() {
  const [tilt, setTilt] = useState({ x: 10, y: -14 });

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: 10 - py * 8, y: -14 + px * 10 });
  }

  function onLeave() {
    setTilt({ x: 10, y: -14 });
  }

  return (
    <div
      className="landing-hero-scene"
      aria-hidden="true"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="landing-hero-glow" />
      <div
        className="landing-hero-tilt landing-hero-tilt-interactive"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="landing-hero-device">
          <div className="landing-hero-device-bar">
            <span className="landing-hero-device-dot" />
            <span className="landing-hero-device-dot" />
            <span className="landing-hero-device-dot" />
          </div>
          <div className="landing-hero-device-body">
            <div className="landing-hero-device-sidebar">
              <VeridianLogo size={22} />
              <div className="landing-hero-device-nav active" />
              <div className="landing-hero-device-nav" />
              <div className="landing-hero-device-nav" />
              <div className="landing-hero-device-nav" />
            </div>
            <div className="landing-hero-device-main">
              <div className="landing-hero-due-card landing-hero-due-card-1">
                <span>Due Today</span>
                <strong>12</strong>
              </div>
              <div className="landing-hero-due-card landing-hero-due-card-2">
                <span>Organic Chem · Module 3</span>
              </div>
              <div className="landing-hero-due-card landing-hero-due-card-3">
                <span>Cell Biology · Quiz</span>
              </div>
              <div className="landing-hero-journey-row">
                <div className="landing-hero-journey-pill" />
                <div className="landing-hero-journey-pill wide" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPipeline() {
  const steps = [
    { num: '01', title: 'Add material', desc: 'Your notes, or clone from Library' },
    { num: '02', title: 'Get a Journey', desc: 'Modules + review schedule built for you' },
    { num: '03', title: 'Follow Due Today', desc: 'One clear list — no guessing' },
    { num: '04', title: 'Show up ready', desc: 'Exam day, nothing forgotten' },
  ];

  return (
    <div className="landing-pipeline" aria-hidden="true">
      <div className="landing-pipeline-track">
        <div className="landing-pipeline-line">
          <div className="landing-pipeline-line-fill" />
        </div>
        {steps.map((step, i) => (
          <div key={step.num} className="landing-pipeline-step" style={{ '--step-i': i }}>
            <div className="landing-pipeline-node">
              <span>{step.num}</span>
            </div>
            <strong>{step.title}</strong>
            <span>{step.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingDueTodayDemo() {
  const items = [
    { subject: 'Organic Chemistry', task: 'SN2 Reactions · 8 cards', due: 'Now' },
    { subject: 'Cell Biology', task: 'Mitosis Quiz · 12 Qs', due: '2h' },
    { subject: 'Calculus II', task: 'Integration · Typing', due: 'Today' },
  ];
  const [active, setActive] = useState(0);

  return (
    <div className="landing-due-demo">
      <div className="landing-due-demo-header">
        <span className="landing-due-demo-label">Due Today</span>
        <span className="landing-due-demo-count">{items.length} sessions</span>
      </div>
      <p className="landing-due-demo-hint">Click a session to preview</p>
      <div className="landing-due-demo-stack">
        {items.map((item, i) => (
          <button
            key={item.subject}
            type="button"
            className={`landing-due-demo-card${active === i ? ' selected' : ''}`}
            style={{ '--card-i': i }}
            onClick={() => setActive(i)}
          >
            <div className="landing-due-demo-card-top">
              <strong>{item.subject}</strong>
              <span className="landing-due-demo-badge">{item.due}</span>
            </div>
            <span className="landing-due-demo-task">{item.task}</span>
            <div className="landing-due-demo-progress">
              <div className="landing-due-demo-progress-fill" style={{ width: active === i ? `${70 - i * 20}%` : '0%' }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const SR_POINTS = [
  { id: 1, label: 'Learn', cx: 20, cy: 30, desc: 'First exposure to new material' },
  { id: 2, label: 'Review', cx: 100, cy: 105, desc: 'Review before the memory fades' },
  { id: 3, label: 'Review', cx: 180, cy: 75, desc: 'Intervals stretch as you master it' },
  { id: 4, label: 'Mastered', cx: 260, cy: 90, desc: 'Long-term retention locked in' },
];

export function LandingSRDiagram() {
  const [hover, setHover] = useState(null);
  const point = SR_POINTS.find((p) => p.id === hover);

  return (
    <div className="landing-sr-diagram">
      <svg viewBox="0 0 320 160" className="landing-sr-svg">
        <defs>
          <linearGradient id="sr-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text-main)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--text-main)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="landing-sr-curve-bg" d="M 20 30 Q 80 120 140 80 T 300 100" fill="none" />
        <path className="landing-sr-curve" d="M 20 30 Q 80 120 140 80 T 300 100" fill="none" />
        <path className="landing-sr-area" d="M 20 30 Q 80 120 140 80 T 300 100 L 300 150 L 20 150 Z" fill="url(#sr-gradient)" />
        {SR_POINTS.map((p) => (
          <g key={p.id}>
            <circle
              className={`landing-sr-dot landing-sr-dot-${p.id}${hover === p.id ? ' hovered' : ''}`}
              cx={p.cx}
              cy={p.cy}
              r={hover === p.id ? 7 : 5}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>
      <div className="landing-sr-labels">
        {SR_POINTS.map((p) => (
          <span
            key={p.id}
            className={`landing-sr-label${hover === p.id ? ' active' : ''}`}
            onMouseEnter={() => setHover(p.id)}
            onMouseLeave={() => setHover(null)}
          >
            {p.label}
          </span>
        ))}
      </div>
      {point && (
        <p className="landing-sr-tooltip">{point.desc}</p>
      )}
    </div>
  );
}

const ROADMAP = [
  { phase: '✓', title: 'App Home', desc: 'Due Today feed & journey dashboard', status: 'done' },
  { phase: '✓', title: 'AI Journey Builder', desc: 'Notes → structured journey with modules', status: 'done' },
  { phase: '✓', title: 'Diagnostic Assessment', desc: 'Placement into Stage A or B per module', status: 'done' },
  { phase: '✓', title: 'Study Sessions', desc: 'Guides, quizzes, flashcards, Feynman & Free Recall', status: 'done' },
  { phase: '→', title: 'Community Library', desc: 'Browse & clone shared journeys', status: 'next' },
  { phase: '→', title: 'Learner Profile', desc: 'Progress, history & knowledge trends', status: 'next' },
  { phase: '→', title: 'Settings', desc: 'Account preferences & app customization', status: 'next' },
  { phase: '—', title: 'Journey-wide Activities', desc: 'Interleaved review & journey challenges', status: 'planned' },
  { phase: '—', title: 'Personalization', desc: 'Smarter scheduling tuned to how you study', status: 'planned' },
];

export function LandingRoadmapTimeline() {
  return (
    <div className="landing-roadmap">
      <div className="landing-roadmap-spine">
        <div className="landing-roadmap-spine-fill" />
      </div>
      {ROADMAP.map((item, i) => (
        <div
          key={item.phase}
          className={`landing-roadmap-item landing-roadmap-${item.status}`}
          style={{ '--road-i': i }}
        >
          <div className="landing-roadmap-marker">
            <span>{item.phase}</span>
          </div>
          <div className="landing-roadmap-content">
            <strong>{item.title}</strong>
            <span>{item.desc}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const MODULES = ['Bonding', 'Reactions', 'Mechanisms', 'Synthesis'];

export function LandingJourneyTree() {
  const [active, setActive] = useState(2);

  return (
    <div className="landing-journey-tree">
      <div className="landing-journey-root">
        <span>Organic Chemistry</span>
        <small>Exam in 14 days · click a module</small>
      </div>
      <div className="landing-journey-branches">
        {MODULES.map((mod, i) => (
          <button
            key={mod}
            type="button"
            className={`landing-journey-branch${i < 2 ? ' done' : ''}${active === i ? ' active' : ''}`}
            style={{ '--branch-i': i }}
            onClick={() => setActive(i)}
          >
            <div className="landing-journey-module">
              <span>{mod}</span>
              {i < 2 && active !== i && <span className="landing-journey-check">✓</span>}
              {active === i && <span className="landing-journey-pulse" />}
            </div>
          </button>
        ))}
      </div>
      <p className="landing-journey-active-label">
        {active < 2 ? `${MODULES[active]} — completed` : `${MODULES[active]} — in progress`}
      </p>
    </div>
  );
}
