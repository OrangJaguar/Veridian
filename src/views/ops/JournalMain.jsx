import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { formatDate, getTodayISO } from '../../lib/utils-date';
import { MOOD_EMOJI } from '../../lib/constants-storage';

const MOODS = Object.keys(MOOD_EMOJI);

export default function JournalMain() {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAxiomStore();
  const [selectedId, setSelectedId] = useState(null);
  const [drafting, setDrafting] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftMood, setDraftMood] = useState('neutral');

  const today = getTodayISO();
  const todayEntry = journal.find(e => e.date.startsWith(today));
  const activeEntry = journal.find(e => e.id === selectedId) ?? todayEntry ?? null;

  const handleNewEntry = () => { setDrafting(true); setDraftContent(''); setDraftMood('neutral'); setSelectedId(null); };

  const handleSave = () => {
    if (todayEntry) {
      updateJournalEntry(todayEntry.id, { content: draftContent, mood: draftMood });
    } else {
      addJournalEntry({ date: today, content: draftContent, mood: draftMood });
    }
    setDrafting(false);
  };

  const sorted = [...journal].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="axiom-view axiom-journal">
      <div className="axiom-journal-sidebar">
        <div className="axiom-journal-sidebar-header">
          <h2>Journal</h2>
          <button className="axiom-btn axiom-btn-primary" onClick={handleNewEntry}>+ Today</button>
        </div>
        <div className="axiom-journal-list">
          {sorted.map(entry => (
            <div key={entry.id}
              className={`axiom-journal-item ${activeEntry?.id === entry.id ? 'active' : ''}`}
              onClick={() => { setSelectedId(entry.id); setDrafting(false); }}>
              <div className="axiom-journal-item-date">{formatDate(entry.date, 'short')}</div>
              <div className="axiom-journal-item-mood">{MOOD_EMOJI[entry.mood ?? 'neutral']}</div>
              <div className="axiom-journal-item-preview axiom-muted">{entry.content.replace(/<[^>]*>/g, '').slice(0, 50)}…</div>
            </div>
          ))}
          {journal.length === 0 && <p className="axiom-muted axiom-empty">No entries yet</p>}
        </div>
      </div>

      <div className="axiom-journal-main">
        {drafting ? (
          <div className="axiom-journal-editor">
            <div className="axiom-journal-editor-header">
              <h3>{todayEntry ? 'Edit Today' : 'New Entry'} — {formatDate(today, 'long')}</h3>
              <div className="axiom-mood-picker">
                {MOODS.map(m => (
                  <button key={m} className={`axiom-mood-btn ${draftMood === m ? 'active' : ''}`} onClick={() => setDraftMood(m)} title={m}>
                    {MOOD_EMOJI[m]}
                  </button>
                ))}
              </div>
            </div>
            <textarea className="axiom-journal-textarea" value={draftContent}
              onChange={e => setDraftContent(e.target.value)} placeholder="What's on your mind today…" autoFocus />
            <div className="axiom-journal-actions">
              <button className="axiom-btn axiom-btn-primary" onClick={handleSave}>Save</button>
              <button className="axiom-btn" onClick={() => setDrafting(false)}>Cancel</button>
            </div>
          </div>
        ) : activeEntry ? (
          <div className="axiom-journal-view">
            <div className="axiom-journal-view-header">
              <div>
                <h3>{formatDate(activeEntry.date, 'long')}</h3>
                <span className="axiom-muted">{MOOD_EMOJI[activeEntry.mood ?? 'neutral']} {activeEntry.mood}</span>
              </div>
              <div className="axiom-journal-view-actions">
                <button className="axiom-btn" onClick={() => { setDraftContent(activeEntry.content); setDraftMood(activeEntry.mood ?? 'neutral'); setDrafting(true); }}>Edit</button>
                <button className="axiom-btn axiom-btn-danger" onClick={() => { deleteJournalEntry(activeEntry.id); setSelectedId(null); }}>Delete</button>
              </div>
            </div>
            <div className="axiom-journal-content">{activeEntry.content}</div>
          </div>
        ) : (
          <div className="axiom-journal-empty axiom-muted">
            <p>Select an entry or write today's journal</p>
            <button className="axiom-btn axiom-btn-primary" onClick={handleNewEntry}>Write Today</button>
          </div>
        )}
      </div>
    </div>
  );
}