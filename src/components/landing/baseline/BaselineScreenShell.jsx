import { motion } from 'framer-motion';
import { getBaselineSlideTransition } from './baselineMotion';

export default function BaselineScreenShell({
  children,
  reducedMotion,
  variant = 'quiz',
}) {
  const slide = getBaselineSlideTransition(reducedMotion);
  const rich = variant !== 'quiz';

  return (
    <motion.div
      className={`baseline-screen baseline-screen--${variant}`}
      initial={slide.initial}
      animate={slide.animate}
      exit={slide.exit}
      transition={slide.transition}
    >
      {rich && (
        <div className="baseline-screen-ambience" aria-hidden="true">
          <span className="baseline-orb baseline-orb-a" />
          <span className="baseline-orb baseline-orb-b" />
          {variant === 'reveal' && <span className="baseline-orb baseline-orb-c" />}
        </div>
      )}
      <div className={`baseline-card baseline-card--${variant}`}>
        {children}
      </div>
    </motion.div>
  );
}
