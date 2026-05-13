import { useLayoutEffect } from 'react';
import AxiomLayout from './components/AxiomLayout';
import { runAxiomApp } from './axiom/runAxiomApp';

let axiomBootStarted = false;

export default function App() {
  useLayoutEffect(() => {
    if (axiomBootStarted) return;
    axiomBootStarted = true;
    runAxiomApp();
  }, []);

  return <AxiomLayout />;
}