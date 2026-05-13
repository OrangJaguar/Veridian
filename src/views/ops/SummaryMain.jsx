import React from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';
import { getWeeklyWorkMinutes } from '../../lib/ops/telemetry-storage';
import { DAY_NAMES } from '../../lib/utils-date';

export default function SummaryMain() {
  const { tasks, typingResults, journal, decks } = useAxiomStore();
  const weeklyMinutes = getWeeklyWorkMinutes();
  const totalMinutes = weeklyMinutes.reduce((a, b) => a + b, 0);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const bestWPM = typingResults.length > 0 ? Math.max(...typingResults.map(r => r.wpm)) : 0;
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);

  return (
    <div className="axiom-view axiom-summary">
      <h2>Weekly Summary</h2>
      <div className="axiom-summary-grid">
        <div className="axiom-card">
          <h3>Focus Time</h3>
          <div className="axiom-stat-big">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</div>
          <p className="axiom-muted">this week</p>
          <div className="axiom-bar-chart">
            {weeklyMinutes.map((m, i) => (
              <div key={i} className="axiom-bar-col">
                <div className="axiom-bar" style={{ height: `${Math.round((m / (Math.max(...weeklyMinutes) || 1)) * 80)}px` }} title={`${m}m`} />
                <span className="axiom-bar-label axiom-muted">{DAY_NAMES[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="axiom-card">
          <h3>Tasks</h3>
          <div className="axiom-stat-big">{completedTasks}<span className="axiom-muted">/{totalTasks}</span></div>
          <div className="axiom-progress-bar"><div className="axiom-progress-fill" style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }} /></div>
        </div>
        <div className="axiom-card">
          <h3>Typing</h3>
          <div className="axiom-stat-big">{bestWPM}</div>
          <p className="axiom-muted">best WPM · {typingResults.length} tests</p>
        </div>
        <div className="axiom-card">
          <h3>Flashcards</h3>
          <div className="axiom-stat-big">{totalCards}</div>
          <p className="axiom-muted">{decks.length} decks</p>
        </div>
        <div className="axiom-card">
          <h3>Journal</h3>
          <div className="axiom-stat-big">{journal.length}</div>
          <p className="axiom-muted">total entries</p>
        </div>
      </div>
    </div>
  );
}