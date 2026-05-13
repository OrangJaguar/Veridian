import React from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { formatDate, getTodayISO } from '../../lib/utils-date';
import { truncate } from '../../lib/utils-text';

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function getMoodEmoji(mood) {
  const map = { great: '😄', good: '🙂', neutral: '😐', bad: '😕', terrible: '😞' };
  return map[mood] ?? '📝';
}

export default function DashboardMain() {
  const { tasks, journal, pomodoroSessions, goals, setOpsView } = useAxiomStore();

  const today = getTodayISO();
  const todayTasks = tasks.filter(t => !t.completed);
  const completedToday = tasks.filter(t => t.completed && t.createdAt?.startsWith(today)).length;
  const todayFocus = pomodoroSessions
    .filter(s => s.date.startsWith(today) && s.type === 'work' && s.completed)
    .reduce((acc, s) => acc + s.duration, 0);
  const todayEntry = journal.find(e => e.date.startsWith(today));
  const activeGoals = goals.filter(g => !g.completed);

  return (
    <div className="axiom-view axiom-dashboard">
      <div className="axiom-dashboard-greeting">
        <h1>Good {getTimeOfDay()}, Scholar</h1>
        <p className="axiom-muted">{formatDate(new Date(), 'long')}</p>
      </div>
      <div className="axiom-dashboard-grid">
        <div className="axiom-card" onClick={() => setOpsView('agenda')}>
          <div className="axiom-card-header"><span className="axiom-card-icon">✓</span><h3>Tasks</h3></div>
          <div className="axiom-stat-big">{todayTasks.length}</div>
          <p className="axiom-muted">pending · {completedToday} done today</p>
          <div className="axiom-task-preview">
            {todayTasks.slice(0, 3).map(t => (
              <div key={t.id} className={`axiom-task-chip priority-${t.priority}`}>{truncate(t.title, 40)}</div>
            ))}
          </div>
        </div>

        <div className="axiom-card" onClick={() => setOpsView('focus')}>
          <div className="axiom-card-header"><span className="axiom-card-icon">◎</span><h3>Focus Time</h3></div>
          <div className="axiom-stat-big">{todayFocus}m</div>
          <p className="axiom-muted">{pomodoroSessions.filter(s => s.date.startsWith(today) && s.type === 'work').length} sessions today</p>
        </div>

        <div className="axiom-card" onClick={() => setOpsView('journal')}>
          <div className="axiom-card-header"><span className="axiom-card-icon">✎</span><h3>Journal</h3></div>
          {todayEntry ? (
            <>
              <div className="axiom-stat-big">{todayEntry.mood ? getMoodEmoji(todayEntry.mood) : '📝'}</div>
              <p className="axiom-muted">{truncate(todayEntry.content.replace(/<[^>]*>/g, ''), 60)}</p>
            </>
          ) : (
            <>
              <div className="axiom-stat-big">—</div>
              <p className="axiom-muted">No entry yet today</p>
            </>
          )}
        </div>

        <div className="axiom-card" onClick={() => setOpsView('mastery')}>
          <div className="axiom-card-header"><span className="axiom-card-icon">★</span><h3>Goals</h3></div>
          <div className="axiom-stat-big">{activeGoals.length}</div>
          <p className="axiom-muted">active goals</p>
          <div className="axiom-goal-preview">
            {activeGoals.slice(0, 2).map(g => (
              <div key={g.id} className="axiom-goal-chip">
                <span>{truncate(g.title, 30)}</span>
                <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${g.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}