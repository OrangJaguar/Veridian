import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { DAY_NAMES } from '../../lib/utils-date';
import { getBlocksForDay, sortBlocksByTime, blockDurationMinutes } from '../../lib/cmd/schedule';
import { formatTime12 } from '../../lib/cmd/time-format';

export default function CmdPanel() {
  const { setMode, scheduleBlocks, addScheduleBlock, deleteScheduleBlock, goals, mastery } = useAxiomStore();
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({ title: '', startTime: '09:00', endTime: '10:00', subject: '', color: '#6366f1' });

  const handleAddBlock = () => {
    if (!newBlock.title.trim()) return;
    addScheduleBlock({ ...newBlock, day: activeDay });
    setShowAddBlock(false);
    setNewBlock({ title: '', startTime: '09:00', endTime: '10:00', subject: '', color: '#6366f1' });
  };

  const dayBlocks = sortBlocksByTime(getBlocksForDay(scheduleBlocks, activeDay));

  return (
    <div className="axiom-cmd-panel">
      <div className="axiom-cmd-topbar">
        <div className="axiom-cmd-logo">
          <span className="axiom-logo-text">AXIOM</span>
          <span className="axiom-logo-tag">CMD</span>
        </div>
        <button className="axiom-mode-btn" onClick={() => setMode('ops')}>← OPS</button>
      </div>
      <div className="axiom-cmd-body">
        <section className="axiom-cmd-section">
          <h2>Weekly Schedule</h2>
          <div className="axiom-day-tabs">
            {DAY_NAMES.map((day, i) => (
              <button key={i} className={`axiom-day-tab ${activeDay === i ? 'active' : ''}`} onClick={() => setActiveDay(i)}>{day}</button>
            ))}
          </div>
          <div className="axiom-schedule-list">
            {dayBlocks.map(block => (
              <div key={block.id} className="axiom-schedule-block" style={{ borderLeft: `3px solid ${block.color ?? '#6366f1'}` }}>
                <div className="axiom-schedule-block-info">
                  <span className="axiom-schedule-block-title">{block.title}</span>
                  <span className="axiom-muted">{formatTime12(block.startTime)} – {formatTime12(block.endTime)}</span>
                  <span className="axiom-muted">{blockDurationMinutes(block)}m</span>
                  {block.subject && <span className="axiom-tag">{block.subject}</span>}
                </div>
                <button className="axiom-btn axiom-btn-danger axiom-btn-sm" onClick={() => deleteScheduleBlock(block.id)}>✕</button>
              </div>
            ))}
            {dayBlocks.length === 0 && <p className="axiom-muted axiom-empty">Nothing scheduled</p>}
          </div>
          <button className="axiom-btn axiom-btn-primary" onClick={() => setShowAddBlock(v => !v)}>
            {showAddBlock ? 'Cancel' : '+ Add Block'}
          </button>
          {showAddBlock && (
            <div className="axiom-add-block-form">
              <input className="axiom-input" placeholder="Title" value={newBlock.title} onChange={e => setNewBlock(b => ({ ...b, title: e.target.value }))} />
              <input className="axiom-input" placeholder="Subject" value={newBlock.subject} onChange={e => setNewBlock(b => ({ ...b, subject: e.target.value }))} />
              <label className="axiom-settings-label">Start<input type="time" className="axiom-input" value={newBlock.startTime} onChange={e => setNewBlock(b => ({ ...b, startTime: e.target.value }))} /></label>
              <label className="axiom-settings-label">End<input type="time" className="axiom-input" value={newBlock.endTime} onChange={e => setNewBlock(b => ({ ...b, endTime: e.target.value }))} /></label>
              <label className="axiom-settings-label">Color<input type="color" value={newBlock.color} onChange={e => setNewBlock(b => ({ ...b, color: e.target.value }))} /></label>
              <button className="axiom-btn axiom-btn-primary" onClick={handleAddBlock}>Add</button>
            </div>
          )}
        </section>
        <section className="axiom-cmd-section">
          <h2>Goals</h2>
          <div className="axiom-cmd-goals">
            {goals.filter(g => !g.completed).map(g => (
              <div key={g.id} className="axiom-cmd-goal-item">
                <span>{g.title}</span>
                {g.deadline && <span className="axiom-muted">→ {g.deadline}</span>}
                <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${g.progress}%` }} /></div>
                <span className="axiom-muted">{g.progress}%</span>
              </div>
            ))}
            {goals.filter(g => !g.completed).length === 0 && <p className="axiom-muted">No active goals</p>}
          </div>
        </section>
        <section className="axiom-cmd-section">
          <h2>Subject Mastery</h2>
          <div className="axiom-cmd-mastery">
            {mastery.map(m => (
              <div key={m.subject} className="axiom-cmd-mastery-item">
                <div className="axiom-mastery-header"><span>{m.subject}</span><span className="axiom-muted">{m.level}%</span></div>
                <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${m.level}%`, background: m.color ?? '#6366f1' }} /></div>
                <span className="axiom-muted">{m.hoursStudied}h studied</span>
              </div>
            ))}
            {mastery.length === 0 && <p className="axiom-muted">No subjects tracked</p>}
          </div>
        </section>
      </div>
    </div>
  );
}