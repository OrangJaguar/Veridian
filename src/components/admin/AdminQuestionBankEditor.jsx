import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateActivity } from '@/api/entities/activities';
import { generateQuestionId } from '@/utils/schemas/ids';

function emptyQuestion() {
  return {
    id: generateQuestionId(),
    type: 'multipleChoice',
    stem: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
  };
}

export default function AdminQuestionBankEditor({ journeyId, activity }) {
  const qc = useQueryClient();
  const [questions, setQuestions] = useState(
    () => activity.content?.questionBank?.length
      ? activity.content.questionBank
      : [emptyQuestion()],
  );

  const updateQ = (index, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const save = async () => {
    try {
      await updateActivity(activity.activityId, {
        content: {
          ...activity.content,
          questionBank: questions,
          contentSource: 'manual',
        },
        status: 'ready',
        itemCount: questions.length,
      });
      qc.invalidateQueries({ queryKey: ['activities', journeyId] });
      toast.success('Question bank saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="admin-question-bank">
      {questions.map((q, index) => (
        <div key={q.id} className="admin-question-block">
          <h3 className="admin-subtitle">Question {index + 1}</h3>
          <label className="settings-field">
            <span className="settings-label">Stem</span>
            <textarea className="settings-input" rows={2} value={q.stem} onChange={(e) => updateQ(index, { stem: e.target.value })} />
          </label>
          {q.options.map((opt, oi) => (
            <label key={oi} className="settings-field">
              <span className="settings-label">Option {String.fromCharCode(65 + oi)}</span>
              <input className="settings-input" value={opt} onChange={(e) => {
                const options = [...q.options];
                options[oi] = e.target.value;
                updateQ(index, { options });
              }}
              />
            </label>
          ))}
          <label className="settings-field">
            <span className="settings-label">Correct answer (must match an option)</span>
            <input className="settings-input" value={q.correctAnswer} onChange={(e) => updateQ(index, { correctAnswer: e.target.value })} />
          </label>
          <label className="settings-field">
            <span className="settings-label">Explanation</span>
            <textarea className="settings-input" rows={2} value={q.explanation} onChange={(e) => updateQ(index, { explanation: e.target.value })} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <div className="admin-editor-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>Add question</button>
        <button type="button" className="btn btn-primary" onClick={save}>Save questions</button>
      </div>
    </div>
  );
}
