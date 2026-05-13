import React, { useEffect, useRef } from 'react';
import { runAxiomApp } from '../axiom/runAxiomApp';
export default function AxiomLayout() {
  const rootRef = useRef(null);
  useEffect(() => {
  if (!rootRef.current) return;
  const container = rootRef.current;
  // Defer by one frame to guarantee the container is painted
  const id = requestAnimationFrame(() => {
    runAxiomApp(container);
  });
  return () => cancelAnimationFrame(id);
}, []);
  return <div ref={rootRef} id="axiom-root" style={{ width: '100%', height: '100vh' }} />;
}