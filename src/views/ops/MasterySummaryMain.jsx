import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { DECK_COLORS } from '../../lib/constants-storage';

export default function MasterySummaryMain() {
  const { mastery, updateMastery, goals, addGoal, updateGoal, deleteGoal } = useAxiomStore();
  const [newSubject, setNewSubject] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    updateMastery(newSubject.trim(), { level: 0, hoursStudied: 0, color: DECK_COLORS[mastery.length % DECK_COLORS.length] });
    setNewSubject('');
  };

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;
    addGoal({ title: newGoalTitle.trim(), deadline: newGoalDeadline || undefined, progress: 0, completed: false });
    setNewGoalTitle(''); setNewGoalDeadline('');
  };

  return (
    <div className="axiom-view axiom-mastery">
      <div className="axiom-mastery-section">
        <h2>Subject Mastery</h2>
        <div className="axiom-mastery-add">
          <input className="axiom-input" placeholder="Add subject…" value={newSubject}
            onChange={e => setNewSubject(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubject()} />
          <button className="axiom-btn axiom-btn-primary" onClick={handleAddSubject}>+</button>
        </div>
        <div className="axiom-mastery-list">
          {mastery.map(m => (
            <div key={m.subject} className="axiom-mastery-item">
              <div className="axiom-mastery-header">
                <span className="axiom-mastery-subject">{m.subject}</span>
                <span className="axiom-muted">{m.level}% mastery</span>
              </div>
              <div className="axiom-progress-bar">
                <div className="axiom-progress-fill" style={{ width: `${m.level}%`, background: m.color ?? '#6366f1' }} />
              </div>
              <div className="axiom-mastery-controls">
                <input type="range" min={0} max={100} value={m.level} onChange={e => updateMastery(m.subject, { level: Number(e.target.value) })} />
                <label className="axiom-muted">Hours:
                  <input type="number" className="axiom-input axiom-input-sm" min={0} value={m.hoursStudied}
                    onChange={e => updateMastery(m.subject, { hoursStudied: Number(e.target.value) })} />
                </label>
              </div>
            </div>
          ))}
          {mastery.length === 0 && <p className="axiom-muted axiom-empty">No subjects tracked yet</p>}
        </div>
      </div>
      <div className="axiom-mastery-section">
        <h2>Goals</h2>
        <div className="axiom-goal-add">
          <input className="axiom-input" placeholder="New goal…" value={newGoalTitle} onChange={e => setNewGoalTitle(e.target.value)} />
          <input type="date" className="axiom-input" value={newGoalDeadline} onChange={e => setNewGoalDeadline(e.target.value)} />
          <button className="axiom-btn axiom-btn-primary" onClick={handleAddGoal}>Add</button>
        </div>
        <div className="axiom-goal-list">
          {goals.map(g => (
            <div key={g.id} className={`axiom-goal-item ${g.completed ? 'completed' : ''}`}>
              <div className="axiom-goal-row">
                <input type="checkbox" checked={g.completed} onChange={() => updateGoal(g.id, { completed: !g.completed })} />
                <span className="axiom-goal-title">{g.title}</span>
                {g.deadline && <span className="axiom-muted">due {g.deadline}</span>}
                <button className="axiom-btn axiom-btn-danger axiom-btn-sm" onClick={() => deleteGoal(g.id)}>✕</button>
              </div>
              <div className="axiom-goal-progress">
                <input type="range" min={0} max={100} value={g.progress} onChange={e => updateGoal(g.id, { progress: Number(e.target.value) })} />
                <span className="axiom-muted">{g.progress}%</span>
              </div>
              <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${g.progress}%` }} /></div>
            </div>
          ))}
          {goals.length === 0 && <p className="axiom-muted axiom-empty">No goals yet</p>}
        </div>
      </div>
    </div>
  );
}