import React, { useState } from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { formatDate, isOverdue } from '../../lib/utils-date';

const PRIORITIES = ['low', 'medium', 'high'];

export default function AgendaMain() {
  const { tasks, addTask, deleteTask, toggleTask } = useAxiomStore();
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDue, setNewDue] = useState('');
  const [filter, setFilter] = useState('active');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask({ title: newTitle.trim(), priority: newPriority, dueDate: newDue || undefined, completed: false });
    setNewTitle('');
    setNewDue('');
  };

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const pMap = { high: 0, medium: 1, low: 2 };
    return pMap[a.priority] - pMap[b.priority];
  });

  return (
    <div className="axiom-view axiom-agenda">
      <div className="axiom-agenda-add">
        <input className="axiom-input axiom-input-grow" placeholder="New task…" value={newTitle}
          onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <select className="axiom-input" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="date" className="axiom-input" value={newDue} onChange={e => setNewDue(e.target.value)} />
        <button className="axiom-btn axiom-btn-primary" onClick={handleAdd}>Add</button>
      </div>

      <div className="axiom-filter-tabs">
        {['active', 'all', 'completed'].map(f => (
          <button key={f} className={`axiom-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="axiom-task-list">
        {sorted.map(task => (
          <div key={task.id} className={`axiom-task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`}>
            <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
            <div className="axiom-task-info">
              <span className={`axiom-task-title ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
              {task.dueDate && (
                <span className={`axiom-task-due axiom-muted ${isOverdue(task.dueDate) && !task.completed ? 'overdue' : ''}`}>
                  {formatDate(task.dueDate, 'short')}
                </span>
              )}
            </div>
            <span className={`axiom-priority-badge priority-${task.priority}`}>{task.priority}</span>
            <button className="axiom-btn axiom-btn-danger axiom-btn-sm" onClick={() => deleteTask(task.id)}>✕</button>
          </div>
        ))}
        {sorted.length === 0 && <p className="axiom-muted axiom-empty">No tasks here</p>}
      </div>
    </div>
  );
}