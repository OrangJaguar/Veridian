import { useEffect, useRef } from 'react';

export default function LandingScrollProgress() {
  const fillRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const scrollEl = document.querySelector('.site-layout-body');
    if (!scrollEl) return undefined;

    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const { scrollTop, scrollHeight, clientHeight } = scrollEl;
        const max = scrollHeight - clientHeight;
        const pct = max > 0 ? Math.min(100, Math.max(0, (scrollTop / max) * 100)) : 0;
        if (fillRef.current) fillRef.current.style.height = `${pct}%`;
        if (labelRef.current) labelRef.current.textContent = `${Math.round(pct)}%`;
      });
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="landing-scroll-progress" aria-hidden="true">
      <div className="landing-scroll-progress-track">
        <div ref={fillRef} className="landing-scroll-progress-fill" />
      </div>
      <span ref={labelRef} className="landing-scroll-progress-label">0%</span>
    </div>
  );
}
