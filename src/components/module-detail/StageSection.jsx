import ActivityRow, { stageActivityTypes } from '@/components/module-detail/ActivityRow';

const STAGE_LABELS = {
  A: { title: 'Stage A — Learn', desc: 'Build foundational understanding' },
  B: { title: 'Stage B — Practice', desc: 'Apply knowledge through quizzes and flashcards' },
  C: { title: 'Stage C — Mastery', desc: 'Deepen understanding with advanced techniques' },
};

export default function StageSection({
  stage,
  recommendedStage,
  activities,
  cardsByActivity,
  journeyId,
  moduleId,
  guideComplete = false,
}) {
  const types = stageActivityTypes(stage);
  const stageActivities = activities.filter((a) => types.includes(a.type));
  const info = STAGE_LABELS[stage];
  const isRecommended = stage === recommendedStage;
  const showHonesty = stage === 'A' && recommendedStage === 'A' && !guideComplete;

  return (
    <section className={`module-stage-section${isRecommended ? ' recommended' : ''}`}>
      <div className="module-stage-header">
        <h2 className="module-stage-title">{info.title}</h2>
        {isRecommended && <span className="module-stage-badge">Recommended</span>}
        <p className="module-stage-desc">{info.desc}</p>
        {showHonesty && (
          <p className="module-stage-a-honesty">
            We start with the Learning Guide so early practice isn&apos;t random.
          </p>
        )}
      </div>
      <div className="module-stage-activities">
        {stageActivities.length === 0 ? (
          <p className="journeys-status">No activities in this stage yet.</p>
        ) : (
          stageActivities.map((act) => (
            <ActivityRow
              key={act.activityId ?? act.id}
              activity={act}
              cardCount={(cardsByActivity[act.activityId] ?? []).length}
              journeyId={journeyId}
              moduleId={moduleId}
            />
          ))
        )}
      </div>
    </section>
  );
}
