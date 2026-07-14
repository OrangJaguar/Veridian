import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateActivity } from '@/api/entities/activities';
import { generateQuestionId } from '@/utils/schemas/ids';
import { QUESTION_TYPES, VARIANT_TYPES, MIX_CATEGORIES } from '@/utils/quiz/questionTypes';
import { parseQuizQuestion } from '@/utils/quiz/questionSchemas';

function emptyQuestion(type = 'multipleChoice') {
  const base = {
    id: generateQuestionId(),
    type,
    stem: '',
    explanation: '',
    conceptId: '',
    variantType: '',
    mixCategory: '',
  };
  if (type === 'trueFalse') {
    return { ...base, options: ['True', 'False'], correctAnswer: 'True' };
  }
  if (type === 'shortAnswer') {
    return { ...base, correctAnswer: '', acceptableAnswers: [] };
  }
  if (type === 'multiSelect') {
    return { ...base, options: ['', '', '', ''], correctAnswer: [] };
  }
  if (type === 'ordering') {
    return { ...base, items: ['', '', ''], correctAnswer: ['', '', ''] };
  }
  if (type === 'matching') {
    return {
      ...base,
      leftItems: ['', ''],
      rightItems: ['', ''],
      correctAnswer: {},
    };
  }
  return { ...base, options: ['', '', '', ''], correctAnswer: '' };
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

  const changeType = (index, type) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? emptyQuestion(type) : q)));
  };

  const save = async () => {
    const bad = questions.find((q) => !parseQuizQuestion({
      ...q,
      explanation: q.explanation || 'Review this concept.',
      stem: q.stem || 'Placeholder',
      correctAnswer: q.correctAnswer ?? (q.type === 'multiSelect' ? [] : q.type === 'matching' ? {} : ''),
    }));
    if (bad || questions.some((q) => !q.stem?.trim())) {
      toast.error('Fix invalid questions before saving — each needs a stem and valid fields for its type.');
      return;
    }
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
            <span className="settings-label">Type</span>
            <select
              className="settings-input"
              value={q.type ?? 'multipleChoice'}
              onChange={(e) => changeType(index, e.target.value)}
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            <span className="settings-label">Stem</span>
            <textarea className="settings-input" rows={2} value={q.stem} onChange={(e) => updateQ(index, { stem: e.target.value })} />
          </label>
          <label className="settings-field">
            <span className="settings-label">Concept ID</span>
            <input className="settings-input" value={q.conceptId ?? ''} onChange={(e) => updateQ(index, { conceptId: e.target.value })} />
          </label>
          <label className="settings-field">
            <span className="settings-label">Variant type</span>
            <select className="settings-input" value={q.variantType ?? ''} onChange={(e) => updateQ(index, { variantType: e.target.value || undefined })}>
              <option value="">—</option>
              {VARIANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="settings-field">
            <span className="settings-label">Mix category</span>
            <select className="settings-input" value={q.mixCategory ?? ''} onChange={(e) => updateQ(index, { mixCategory: e.target.value || undefined })}>
              <option value="">—</option>
              {MIX_CATEGORIES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>

          {(q.type === 'multipleChoice' || q.type === 'multiSelect' || !q.type) && q.options?.map((opt, oi) => (
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

          {q.type === 'ordering' && (q.items ?? []).map((item, ii) => (
            <label key={ii} className="settings-field">
              <span className="settings-label">Step {ii + 1}</span>
              <input className="settings-input" value={item} onChange={(e) => {
                const items = [...(q.items ?? [])];
                items[ii] = e.target.value;
                updateQ(index, { items, correctAnswer: items });
              }}
              />
            </label>
          ))}

          {q.type === 'matching' && (q.leftItems ?? []).map((left, li) => (
            <div key={li} className="admin-matching-pair">
              <label className="settings-field">
                <span className="settings-label">Term {li + 1}</span>
                <input className="settings-input" value={left} onChange={(e) => {
                  const leftItems = [...(q.leftItems ?? [])];
                  leftItems[li] = e.target.value;
                  const rightItems = [...(q.rightItems ?? [])];
                  const correctAnswer = Object.fromEntries(
                    leftItems.map((l, i) => [l, rightItems[i] ?? '']),
                  );
                  updateQ(index, { leftItems, correctAnswer });
                }}
                />
              </label>
              <label className="settings-field">
                <span className="settings-label">Definition {li + 1}</span>
                <input className="settings-input" value={q.rightItems?.[li] ?? ''} onChange={(e) => {
                  const rightItems = [...(q.rightItems ?? [])];
                  rightItems[li] = e.target.value;
                  const leftItems = [...(q.leftItems ?? [])];
                  const correctAnswer = Object.fromEntries(
                    leftItems.map((l, i) => [l, rightItems[i] ?? '']),
                  );
                  updateQ(index, { rightItems, correctAnswer });
                }}
                />
              </label>
            </div>
          ))}

          {q.type === 'shortAnswer' && (
            <label className="settings-field">
              <span className="settings-label">Correct answer</span>
              <input className="settings-input" value={q.correctAnswer ?? ''} onChange={(e) => updateQ(index, { correctAnswer: e.target.value })} />
            </label>
          )}

          {(q.type === 'multipleChoice' || q.type === 'trueFalse' || !q.type) && (
            <label className="settings-field">
              <span className="settings-label">Correct answer (must match an option)</span>
              <input className="settings-input" value={q.correctAnswer ?? ''} onChange={(e) => updateQ(index, { correctAnswer: e.target.value })} />
            </label>
          )}

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
