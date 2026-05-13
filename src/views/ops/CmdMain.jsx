import React from 'react';
import { useAxiomStore } from '../../store/useAxiomStore';

export default function CmdMain() {
  const { setMode } = useAxiomStore();
  return (
    <div className="axiom-view axiom-cmd-main">
      <div className="axiom-cmd-teaser">
        <h2>Command Center</h2>
        <p>Switch to CMD mode for your weekly schedule, goals overview, and mastery stats.</p>
        <button className="axiom-btn axiom-btn-primary" onClick={() => setMode('cmd')}>Open CMD Mode →</button>
      </div>
    </div>
  );
}