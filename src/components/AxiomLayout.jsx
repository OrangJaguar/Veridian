import { useEffect } from 'react';
import { runAxiomApp } from '../axiom/runAxiomApp';
export default function AxiomLayout() {
  useEffect(() => {
    runAxiomApp();
  }, []);
  return null;
}