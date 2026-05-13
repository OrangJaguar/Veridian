import React from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '⊞' },
  { id: 'agenda',     label: 'Agenda',     icon: '✓' },
  { id: 'calendar',   label: 'Calendar',   icon: '▦' },
  { id: 'journal',    label: 'Journal',    icon: '✎' },
  { id: 'focus',      label: 'Focus',      icon: '◎' },
  { id: 'flashcards', label: 'Flashcards', icon: '⬡' },
  { id: 'quiz',       label: 'Quiz',       icon: '?' },
  { id: 'typing',     label: 'Typing',     icon: '⌨' },
  { id: 'editor',     label: 'Editor',     icon: '≡' },
  { id: 'mastery',    label: 'Mastery',    icon: '★' },
];

export default function AppHeader() {
  const { opsView, setOpsView, setMode } = useAxiomStore();

  return (
    <header className="axiom-header">
      <div className="axiom-logo" onClick={() => setMode('cmd')} title="Switch to CMD mode">
        <span className="axiom-logo-text">AXIOM</span>
        <span className="axiom-logo-tag">OPS</span>
      </div>
      <nav className="axiom-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`axiom-nav-btn ${opsView === item.id ? 'active' : ''}`}
            onClick={() => setOpsView(item.id)}
            title={item.label}
          >
            <span className="axiom-nav-icon">{item.icon}</span>
            <span className="axiom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="axiom-header-actions">
        <button className="axiom-mode-btn" onClick={() => setMode('cmd')}>CMD</button>
      </div>
    </header>
  );
}