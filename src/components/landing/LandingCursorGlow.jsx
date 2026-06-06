import { useEffect, useRef } from 'react';

/** Subtle cursor glow — fixed position, rAF-throttled */
export default function LandingCursorGlow() {
  const glowRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  useEffect(() => {
    const scrollEl = document.querySelector('.site-layout-body');
    if (!scrollEl) return undefined;

    function onMove(e) {
      target.current = { x: e.clientX, y: e.clientY };
      if (!frame.current) {
        frame.current = requestAnimationFrame(tick);
      }
    }

    function tick() {
      frame.current = 0;
      pos.current.x += (target.current.x - pos.current.x) * 0.1;
      pos.current.y += (target.current.y - pos.current.y) * 0.1;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
    }

    scrollEl.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      scrollEl.removeEventListener('mousemove', onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div className="landing-cursor-layer" aria-hidden="true">
      <div ref={glowRef} className="landing-cursor-glow" />
    </div>
  );
}
