import DetailBackButton from '@/components/shared/DetailBackButton';

const STAGE_LABELS = { A: 'Learn', B: 'Practice', C: 'Mastery' };

export default function ModuleDetailHeader({ module: mod, journey, journeyId }) {
  const stage = mod.stage || 'A';
  const mastery = mod.masteryScore ?? 0;
  const backLabel = journey?.title ?? 'Journey';

  return (
    <>
      <header className="detail-title-header">
        <DetailBackButton to={`/journeys/${journeyId}`} label={backLabel} />
        <div className="detail-title-body">
          <h1 className="module-detail-title">{mod.name}</h1>
          {mod.description && <p className="module-detail-desc">{mod.description}</p>}
        </div>
      </header>

      <section className="detail-meta-section" aria-label="Module details">
        <div className="detail-meta-tags">
          <span>{journey?.subject}</span>
          <span className="journey-detail-meta-sep" aria-hidden>·</span>
          <span>Stage {stage} · {STAGE_LABELS[stage]}</span>
        </div>
        <div className="detail-meta-mastery">
          <div className="detail-mastery-bar" aria-hidden>
            <div className="detail-mastery-fill" style={{ width: `${mastery}%` }} />
          </div>
          <span className="detail-mastery-label">{mastery}% mastery</span>
        </div>
      </section>
    </>
  );
}
