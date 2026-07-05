import { useState } from 'react';
import {
  LandingActivityPreviewFrame,
  LandingGuidePreview,
  LandingQuizPreview,
  LandingFlashcardPreview,
  LandingFeynmanPreview,
  LandingFreeRecallPreview,
} from './LandingActivityPreviews';

const STAGES = [
  {
    id: 'A',
    label: 'Stage A',
    title: 'Learn',
    summary: 'Guided walkthrough with embedded check-ins after each section.',
    activities: ['guide'],
  },
  {
    id: 'B',
    label: 'Stage B',
    title: 'Practice',
    summary: 'AI-generated questions that never repeat — always from your source material.',
    activities: ['quiz', 'flashcards'],
  },
  {
    id: 'C',
    label: 'Stage C',
    title: 'Mastery',
    summary: 'No hints, no scaffolding. Prove you can retrieve it cold.',
    activities: ['feynman', 'recall'],
  },
];

const ACTIVITIES = {
  guide: {
    name: 'Learning Guide',
    tagline: 'Stage A — Learn',
    description:
      'Sectioned lessons with key terms, takeaways, worked examples, and a check-in you must pass before continuing.',
    note: 'You answer something after every section — it is not passive reading.',
    detail: 'Built from your uploaded material, not generic filler.',
    Preview: LandingGuidePreview,
  },
  quiz: {
    name: 'Practice Quiz',
    tagline: 'Stage B — Practice',
    description:
      'Fresh multiple-choice questions built from your notes, with flags, timers, and feedback on what you missed.',
    note: 'Every session generates new wording so you practice translation, not recognition.',
    detail: 'Missed questions feed back into what surfaces in Due Today.',
    Preview: LandingQuizPreview,
  },
  flashcards: {
    name: 'Flashcards',
    tagline: 'Stage B — Practice',
    description:
      'Flip cards from your journey, then rate Again / Hard / Good / Easy so FSRS schedules the next review.',
    note: 'Cards you struggle with come back sooner; cards you know stretch out over weeks.',
    detail: 'Definitions, formulas, and relationships pulled straight from your modules.',
    Preview: LandingFlashcardPreview,
  },
  feynman: {
    name: 'Feynman',
    tagline: 'Stage C — Mastery',
    description:
      'Explain concepts in plain language in a short chat — the AI follows up on gaps in your understanding.',
    note: 'If you cannot teach it simply, you do not know it well enough yet.',
    detail: 'Multi-turn conversation, not a single submit box.',
    Preview: LandingFeynmanPreview,
  },
  recall: {
    name: 'Free Recall',
    tagline: 'Stage C — Mastery',
    description:
      'Blank page, running timer, optional hints — write everything you remember without scaffolding.',
    note: 'The honest test of whether you can produce the answer unprompted.',
    detail: 'No multiple choice, no prompts beyond the topic.',
    Preview: LandingFreeRecallPreview,
  },
};

export default function LandingActivityExplorer() {
  const [activeStageId, setActiveStageId] = useState('A');
  const stage = STAGES.find((item) => item.id === activeStageId) ?? STAGES[0];
  const [activeActivityId, setActiveActivityId] = useState(stage.activities[0]);

  const selectStage = (stageId) => {
    const nextStage = STAGES.find((item) => item.id === stageId) ?? STAGES[0];
    setActiveStageId(stageId);
    setActiveActivityId(nextStage.activities[0]);
  };

  const activity = ACTIVITIES[activeActivityId] ?? ACTIVITIES.guide;
  const Preview = activity.Preview;

  return (
    <div className="landing-activity-explorer">
      <div className="landing-activity-stage-picker" role="tablist" aria-label="Module stages">
        {STAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeStageId === item.id}
            className={`landing-activity-stage-pick${activeStageId === item.id ? ' active' : ''}`}
            onClick={() => selectStage(item.id)}
          >
            <span>{item.label}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </div>

      <p className="landing-activity-stage-summary">{stage.summary}</p>

      <div className="landing-interactive-modes landing-interactive-modes--explorer">
        <div className="landing-mode-picker" role="tablist" aria-label="Activity types">
          {stage.activities.map((activityId) => (
            <button
              key={activityId}
              type="button"
              role="tab"
              aria-selected={activeActivityId === activityId}
              className={`landing-mode-pick${activeActivityId === activityId ? ' active' : ''}`}
              onClick={() => setActiveActivityId(activityId)}
            >
              {ACTIVITIES[activityId].name}
            </button>
          ))}
        </div>
        <div className="landing-mode-showcase landing-mode-showcase--fixed" role="tabpanel">
          <div className="landing-mode-showcase-copy">
            <span className="landing-mode-showcase-tag">{activity.tagline}</span>
            <h3>{activity.name}</h3>
            <p className="landing-activity-description">{activity.description}</p>
            <p className="landing-activity-note">{activity.note}</p>
            <p className="landing-activity-detail">{activity.detail}</p>
          </div>
          <div className="landing-mode-showcase-preview landing-mode-showcase-preview--interactive">
            <LandingActivityPreviewFrame key={activeActivityId}>
              <Preview />
            </LandingActivityPreviewFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
