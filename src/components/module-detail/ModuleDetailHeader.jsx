const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

export default function ModuleDetailHeader({ module: mod, journey }) {
  const stage = mod.stage || 'A';
  const mastery = mod.masteryScore ?? 0;

  return (
    <header className="module-detail-header">
      <p className="journey-detail-subject">{journey?.subject}</p>
      <h1 className="module-detail-title">{mod.name}</h1>
      {mod.description && <p className="module-detail-desc">{mod.description}</p>}
      <div className="module-detail-meta">
        <span className={`journey-module-stage stage-${stage}`}>
          Stage {stage} · {STAGE_LABELS[stage]}
        </span>
        <span className="module-detail-mastery">{mastery}% mastery</span>
      </div>
    </header>
  );
}
