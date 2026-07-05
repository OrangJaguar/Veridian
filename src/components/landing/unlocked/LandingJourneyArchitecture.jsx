import { useState } from 'react';

const MODULES = [
  { id: 'gene', name: 'Gene Expression', stage: 'B' },
  { id: 'cell', name: 'Cell Structure', stage: 'C' },
  { id: 'heredity', name: 'Heredity', stage: 'A' },
];

const STAGE_INFO = {
  A: {
    label: 'Stage A',
    title: 'Learn',
    desc: 'Guided Learning Guide with check-ins — not passive reading.',
  },
  B: {
    label: 'Stage B',
    title: 'Practice',
    desc: 'Fresh AI questions from your material every session.',
  },
  C: {
    label: 'Stage C',
    title: 'Mastery',
    desc: 'Active recall with no scaffolding — prove you know it.',
  },
};

export default function LandingJourneyArchitecture() {
  const [activeModuleId, setActiveModuleId] = useState('gene');
  const activeModule = MODULES.find((mod) => mod.id === activeModuleId) ?? MODULES[0];
  const stageInfo = STAGE_INFO[activeModule.stage];

  return (
    <div className="landing-architecture" aria-label="Journey architecture diagram">
      <div className="landing-architecture-journey">
        <div className="landing-architecture-journey-head">
          <span className="landing-architecture-eyebrow">Journey</span>
          <strong>AP Biology</strong>
          <span className="landing-architecture-meta">May 12 · 14 modules</span>
        </div>
        <div className="landing-architecture-modules">
          {MODULES.map((mod) => (
            <button
              key={mod.id}
              type="button"
              className={`landing-architecture-module${activeModuleId === mod.id ? ' active' : ''}`}
              onClick={() => setActiveModuleId(mod.id)}
            >
              <span className={`landing-architecture-stage-pill stage-${mod.stage}`}>
                {mod.stage}
              </span>
              <span className="landing-architecture-module-name">{mod.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="landing-architecture-stage-panel">
        <div className="landing-architecture-stage-track" aria-hidden="true">
          {['A', 'B', 'C'].map((stage) => (
            <span
              key={stage}
              className={`landing-architecture-stage-node stage-${stage}${activeModule.stage === stage ? ' active' : ''}`}
            >
              {stage}
            </span>
          ))}
        </div>
        <div className="landing-architecture-stage-copy">
          <span className="landing-architecture-eyebrow">{stageInfo.label}</span>
          <h3>{stageInfo.title}</h3>
          <p>{stageInfo.desc}</p>
        </div>
      </div>
    </div>
  );
}
