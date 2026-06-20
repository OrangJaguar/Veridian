import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { updateModule } from '@/api/entities/modules';
import { generateConceptId } from '@/utils/schemas/ids';

export default function AdminKnowledgeMapEditor({ journeyId, moduleId, module }) {
  const qc = useQueryClient();
  const [concepts, setConcepts] = useState(() => module.knowledgeMap?.concepts ?? []);
  const [draft, setDraft] = useState({ term: '', definition: '' });

  const addConcept = () => {
    if (!draft.term.trim()) return;
    setConcepts((prev) => [...prev, {
      id: generateConceptId(),
      term: draft.term.trim(),
      definition: draft.definition.trim(),
    }]);
    setDraft({ term: '', definition: '' });
  };

  const save = async () => {
    try {
      await updateModule(moduleId, { knowledgeMap: { concepts } });
      qc.invalidateQueries({ queryKey: ['module', journeyId, moduleId] });
      toast.success('Concepts saved');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="admin-concepts-editor">
      <div className="admin-card-form">
        <input className="settings-input" placeholder="Term" value={draft.term} onChange={(e) => setDraft({ ...draft, term: e.target.value })} />
        <input className="settings-input" placeholder="Definition" value={draft.definition} onChange={(e) => setDraft({ ...draft, definition: e.target.value })} />
        <button type="button" className="btn btn-primary btn-sm" onClick={addConcept}>Add concept</button>
      </div>
      <ul className="admin-concept-list">
        {concepts.map((c) => (
          <li key={c.id} className="admin-concept-row">
            <strong>{c.term}</strong>
            <span>{c.definition}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConcepts((prev) => prev.filter((x) => x.id !== c.id))}>Remove</button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-primary" onClick={save}>Save concepts</button>
    </div>
  );
}
