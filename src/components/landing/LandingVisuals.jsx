import { useState } from 'react';
import { Home, Map, Users, User, ChevronLeft, ChevronDown } from 'lucide-react';
import VeridianLogo from '@/components/layout/VeridianLogo';

const SIDEBAR_ICONS = [Home, Map, Users, User];

/** 3D-tilted hero — miniature of the real Home screen */
export function LandingHeroScene() {
  const [tilt, setTilt] = useState({ x: 10, y: -14 });
  const reduceTilt = typeof window !== 'undefined' && window.innerWidth <= 640;

  function onMove(e) {
    if (reduceTilt) return;
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
        <div className="landing-hero-device landing-hero-device-wide">
          <div className="landing-hero-device-bar">
            <span className="landing-hero-device-dot" />
            <span className="landing-hero-device-dot" />
            <span className="landing-hero-device-dot" />
          </div>
          <div className="landing-hero-device-body">
            <div className="landing-hero-device-sidebar">
              <VeridianLogo size={20} />
              {SIDEBAR_ICONS.map((Icon, i) => (
                <span
                  key={Icon.displayName ?? i}
                  className={`landing-hero-nav-icon${i === 0 ? ' active' : ''}`}
                >
                  <Icon size={14} strokeWidth={2} />
                </span>
              ))}
            </div>
            <div className="landing-hero-device-main landing-hero-home-mock">
              <div className="landing-mini-welcome-row">
                <span className="landing-mini-greeting">Good evening, Alex</span>
                <span className="landing-mini-date">Fri, Jun 5</span>
              </div>
              <div className="landing-mini-due-header">
                <span className="landing-mini-due-title">Due Today</span>
                <span className="landing-mini-due-est">Today&apos;s plan · ~45 min</span>
              </div>
              <div className="landing-mini-progress">
                <span>1 of 3 done today</span>
                <div className="landing-mini-progress-track">
                  <div className="landing-mini-progress-fill" style={{ width: '33%' }} />
                </div>
              </div>
              <div className="landing-mini-focus-card">
                <span className="landing-mini-focus-eyebrow">Focus now</span>
                <strong className="landing-mini-focus-title">Learning Guide</strong>
                <span className="landing-mini-focus-context">AP Biology · Gene Expression</span>
                <div className="landing-mini-focus-footer">
                  <span>~20 min</span>
                  <span className="landing-mini-btn">Continue</span>
                </div>
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

/** Miniature of the real Due Today zone on Home */
export function LandingDueTodayDemo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="landing-due-demo landing-due-demo-real">
      <div className="landing-mini-due-header">
        <span className="landing-mini-due-title">Due Today</span>
        <span className="landing-mini-due-est">Today&apos;s plan · ~52 min</span>
      </div>

      <div className="landing-mini-progress">
        <span>0 of 3 done today</span>
        <div className="landing-mini-progress-track">
          <div className="landing-mini-progress-fill" style={{ width: '0%' }} />
        </div>
      </div>

      <div className="landing-mini-focus-card landing-mini-focus-card-lg">
        <span className="landing-mini-focus-eyebrow">Focus now</span>
        <strong className="landing-mini-focus-title">Practice Quiz</strong>
        <span className="landing-mini-focus-context">AP Biology · Cell Structure</span>
        <div className="landing-mini-focus-footer">
          <span>~15 min</span>
          <span className="landing-mini-btn">Start</span>
        </div>
      </div>

      <button
        type="button"
        className="landing-mini-queue-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        2 more sessions today
        <ChevronDown size={14} className={expanded ? 'expanded' : ''} />
      </button>

      {expanded && (
        <div className="landing-mini-queue">
          <div className="landing-mini-queue-row">
            <div>
              <strong>Flashcard Set</strong>
              <span>AP Biology · Heredity</span>
            </div>
            <div className="landing-mini-queue-meta">
              <span>~12 min</span>
              <span className="landing-mini-btn secondary">Review</span>
            </div>
          </div>
          <div className="landing-mini-queue-row">
            <div>
              <strong>Learning Guide</strong>
              <span>Organic Chemistry · Reactions</span>
            </div>
            <div className="landing-mini-queue-meta">
              <span>~20 min</span>
              <span className="landing-mini-btn secondary">Continue</span>
            </div>
          </div>
        </div>
      )}
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
  { phase: '→', title: 'Smarter suggestions', desc: 'Adaptive daily picks based on weak spots & exam proximity', status: 'next' },
  { phase: '—', title: 'Learning profile', desc: 'Knowledge maps, trends, and concept-level insights', status: 'planned' },
  { phase: '—', title: 'Study streaks & insights', desc: 'Momentum tracking and gentle nudges when you slip', status: 'planned' },
  { phase: '—', title: 'Ease-of-life', desc: 'Quick actions, keyboard shortcuts, and smarter defaults', status: 'planned' },
];

export function LandingRoadmapTimeline() {
  return (
    <div className="landing-roadmap">
      <div className="landing-roadmap-spine">
        <div className="landing-roadmap-spine-fill" />
      </div>
      {ROADMAP.map((item, i) => (
        <div
          key={item.title}
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

const JOURNEY_MODULES = [
  { name: 'Cell Structure', stage: 'C', mastery: 82, desc: 'Organelles and membranes' },
  { name: 'Gene Expression', stage: 'B', mastery: 58, desc: 'Transcription and translation' },
  { name: 'Heredity', stage: 'A', mastery: 24, desc: 'Mendelian genetics' },
];

/** Miniature of Journey detail page */
export function LandingJourneyTree() {
  const [expanded, setExpanded] = useState(1);

  return (
    <div className="landing-journey-detail-demo" aria-hidden="true">
      <div className="landing-mini-detail-header">
        <span className="landing-mini-back">
          <ChevronLeft size={14} />
          Journeys
        </span>
        <h3 className="landing-mini-journey-title">AP Biology</h3>
      </div>

      <div className="landing-mini-detail-meta">
        <div className="landing-mini-meta-tags">
          <span>Biology</span>
          <span>·</span>
          <span>May 12, 2026</span>
          <span>·</span>
          <span>14 days left</span>
        </div>
        <div className="landing-mini-mastery">
          <div className="landing-mini-mastery-bar">
            <div style={{ width: '54%' }} />
          </div>
          <span>54% mastery</span>
        </div>
      </div>

      <div className="landing-mini-section-box">
        <p className="landing-mini-section-label">Modules</p>
        <ul className="landing-mini-module-list">
          {JOURNEY_MODULES.map((mod, i) => (
            <li key={mod.name} className={expanded === i ? 'expanded' : ''}>
              <button
                type="button"
                className="landing-mini-module-row"
                onClick={() => setExpanded(expanded === i ? -1 : i)}
              >
                <div className="landing-mini-module-main">
                  <strong>{mod.name}</strong>
                  <span>{mod.desc}</span>
                </div>
                <div className="landing-mini-module-right">
                  <span className={`landing-mini-stage stage-${mod.stage}`}>
                    Stage {mod.stage}
                  </span>
                  <span>{mod.mastery}%</span>
                  <ChevronDown size={14} className={expanded === i ? 'expanded' : ''} />
                </div>
              </button>
              {expanded === i && (
                <div className="landing-mini-module-drawer">
                  <div className="landing-mini-drawer-row">
                    <span>Learning Guide</span>
                    <span className="landing-mini-btn secondary">Continue</span>
                  </div>
                  <div className="landing-mini-drawer-row">
                    <span>Practice Quiz</span>
                    <span className="landing-mini-btn secondary">Start</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="landing-mini-section-box landing-mini-plan-box">
        <p className="landing-mini-section-label">Weekly plan</p>
        <div className="landing-mini-plan-chips">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={`${d}-${i}`} className={`landing-mini-plan-chip${i === 2 ? ' active' : ''}`}>
              <small>{d}</small>
              <strong>{i === 2 ? '#2 📖' : i < 2 ? '✓' : '—'}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
