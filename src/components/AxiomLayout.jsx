import React, { useEffect, useRef } from 'react';
import { runAxiomApp } from '../axiom/runAxiomApp';
export default function AxiomLayout() {
  const rootRef = useRef(null);
  useEffect(() => {
    if (rootRef.current) {
      runAxiomApp(rootRef.current);
    }
  }, []);
  return <div ref={rootRef} id="axiom-root" style={{ width: '100%', height: '100vh' }} />;
}