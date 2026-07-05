export function getBaselineSlideTransition(reducedMotion) {
  if (reducedMotion) {
    return {
      initial: { opacity: 1, x: 0 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 1, x: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -48 },
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
  };
}

export function usePrefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
