import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateActivity } from '@/api/entities/activities';

function emptySection(index) {
  return {
    sectionId: `section-${index + 1}`,
    title: `Section ${index + 1}`,
    explanation: '',
    workedExamples: [{
      scenario: '',
      steps: [''],
      answer: '',
      reasoning: '',
    }],
    checkInQuestion: {
      question: '',
      type: 'multipleChoice',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
    },
  };
}

export default function AdminGuideSectionBuilder({ journeyId, moduleId, activity }) {
  const qc = useQueryClient();
  const [sections, setSections] = useState(() => activity.content?.sections?.length
    ? activity.content.sections
    : [emptySection(0)]);

  const updateSection = (index, patch) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const save = async () => {
    try {
      await updateActivity(activity.activityId, {
        content: { ...activity.content, sections, contentSource: 'manual' },
        status: 'ready',
      });
      qc.invalidateQueries({ queryKey: ['activities', journeyId, moduleId] });
      toast.success('Learning guide saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="admin-guide-builder">
      {sections.map((section, index) => (
        <div key={section.sectionId} className="admin-guide-section">
          <h3 className="admin-subtitle">Section {index + 1}</h3>
          <label className="settings-field">
            <span className="settings-label">Title</span>
            <input
              className="settings-input"
              value={section.title}
              onChange={(e) => updateSection(index, { title: e.target.value })}
            />
          </label>
          <label className="settings-field">
            <span className="settings-label">Explanation</span>
            <textarea
              className="settings-input admin-rich-editor"
              rows={8}
              value={section.explanation ?? ''}
              onChange={(e) => updateSection(index, { explanation: e.target.value })}
              placeholder="Write the section explanation. Markdown and LaTeX ($...$) are supported."
            />
          </label>
          <label className="settings-field">
            <span className="settings-label">Worked example scenario</span>
            <textarea
              className="settings-input"
              rows={2}
              value={section.workedExamples?.[0]?.scenario ?? ''}
              onChange={(e) => {
                const ex = { ...(section.workedExamples?.[0] ?? {}), scenario: e.target.value };
                updateSection(index, { workedExamples: [ex] });
              }}
            />
          </label>
          <label className="settings-field">
            <span className="settings-label">Check-in question</span>
            <input
              className="settings-input"
              value={section.checkInQuestion?.question ?? ''}
              onChange={(e) => updateSection(index, {
                checkInQuestion: { ...section.checkInQuestion, question: e.target.value },
              })}
            />
          </label>
          {(section.checkInQuestion?.options ?? []).map((opt, oi) => (
            <label key={oi} className="settings-field">
              <span className="settings-label">Option {oi + 1}</span>
              <input
                className="settings-input"
                value={opt}
                onChange={(e) => {
                  const options = [...(section.checkInQuestion?.options ?? ['', '', '', ''])];
                  options[oi] = e.target.value;
                  updateSection(index, {
                    checkInQuestion: { ...section.checkInQuestion, options },
                  });
                }}
              />
            </label>
          ))}
          <label className="settings-field">
            <span className="settings-label">Correct answer</span>
            <input
              className="settings-input"
              value={section.checkInQuestion?.correctAnswer ?? ''}
              onChange={(e) => updateSection(index, {
                checkInQuestion: { ...section.checkInQuestion, correctAnswer: e.target.value },
              })}
            />
          </label>
        </div>
      ))}
      <div className="admin-editor-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSections((prev) => [...prev, emptySection(prev.length)])}
        >
          Add section
        </button>
        <button type="button" className="btn btn-primary" onClick={save}>Save guide</button>
      </div>
    </div>
  );
}
