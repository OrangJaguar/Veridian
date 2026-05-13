import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { formatDate } from '../../lib/utils-date';
import { truncate, wordCount } from '../../lib/utils-text';

export default function EditorMain() {
  const { editorNotes, addEditorNote, updateEditorNote, deleteEditorNote } = useAxiomStore();
  const [activeId, setActiveId] = useState(editorNotes[0]?.id ?? null);
  const [newTitle, setNewTitle] = useState('');

  const activeNote = editorNotes.find(n => n.id === activeId);

  const handleNew = () => {
    if (!newTitle.trim()) return;
    addEditorNote({ title: newTitle.trim(), content: '', tags: [] });
    setNewTitle('');
  };

  return (
    <div className="axiom-view axiom-editor">
      <div className="axiom-editor-sidebar">
        <div className="axiom-editor-new">
          <input className="axiom-input" placeholder="New note title…" value={newTitle}
            onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNew()} />
          <button className="axiom-btn axiom-btn-primary" onClick={handleNew}>+</button>
        </div>
        <div className="axiom-note-list">
          {editorNotes.map(note => (
            <div key={note.id} className={`axiom-note-item ${activeId === note.id ? 'active' : ''}`} onClick={() => setActiveId(note.id)}>
              <div className="axiom-note-title">{truncate(note.title, 28)}</div>
              <div className="axiom-note-meta axiom-muted">{formatDate(note.updatedAt, 'short')}</div>
            </div>
          ))}
          {editorNotes.length === 0 && <p className="axiom-muted axiom-empty">No notes yet</p>}
        </div>
      </div>
      <div className="axiom-editor-main">
        {activeNote ? (
          <>
            <div className="axiom-editor-topbar">
              <input className="axiom-editor-title-input" value={activeNote.title}
                onChange={e => updateEditorNote(activeId, { title: e.target.value })} />
              <div className="axiom-editor-meta axiom-muted">{wordCount(activeNote.content)} words</div>
              <button className="axiom-btn axiom-btn-danger" onClick={() => { deleteEditorNote(activeId); setActiveId(editorNotes.find(n => n.id !== activeId)?.id ?? null); }}>Delete</button>
            </div>
            <textarea className="axiom-editor-textarea" value={activeNote.content}
              onChange={e => updateEditorNote(activeId, { content: e.target.value })} placeholder="Start writing…" />
          </>
        ) : (
          <div className="axiom-editor-empty axiom-muted"><p>Select a note or create a new one</p></div>
        )}
      </div>
    </div>
  );
}