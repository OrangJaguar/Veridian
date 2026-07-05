import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { trackProductEvent } from '@/lib/analytics';
import { completeBaseline, skipBaseline } from '@/lib/baselineStorage';
import { evaluateRecallAnswers } from './baselineContent';
import { usePrefersReducedMotion } from './baselineMotion';
import BaselineScreenShell from './BaselineScreenShell';
import BaselineScreen1Hook from './BaselineScreen1Hook';
import BaselineScreen2Encoding from './BaselineScreen2Encoding';
import BaselineScreen3Recognition from './BaselineScreen3Recognition';
import BaselineScreen4Recall from './BaselineScreen4Recall';
import BaselineScreen5Reveal from './BaselineScreen5Reveal';

export default function BaselineFlow({ onUnlocked }) {
  const reducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(1);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (step === 1) {
      trackProductEvent('baseline_screen_1');
    }
  }, [step]);

  const go = useCallback((next) => {
    setStep(next);
    trackProductEvent(`baseline_screen_${next}`);
  }, []);

  const handleStart = () => {
    trackProductEvent('baseline_start');
    go(2);
  };

  const handleSkip = () => {
    skipBaseline();
    trackProductEvent('baseline_skip', { screen: 1 });
    trackProductEvent('baseline_unlock', { method: 'skip' });
    onUnlocked?.('skipped');
  };

  const handleRecallComplete = ({ governance, power, timedOut }) => {
    const passed = !timedOut && evaluateRecallAnswers(governance, power);
    setOutcome(passed ? 'passed' : 'failed');
    trackProductEvent(passed ? 'baseline_complete_pass' : 'baseline_complete_fail', {
      outcome: passed ? 'passed' : 'failed',
    });
    if (timedOut) {
      trackProductEvent('baseline_screen_4_timeout');
    } else {
      trackProductEvent('baseline_screen_4_submit');
    }
    go(5);
  };

  const handleRevealComplete = useCallback(() => {
    if (outcome) {
      completeBaseline(outcome);
      trackProductEvent('baseline_unlock', { method: 'complete', outcome });
      onUnlocked?.(outcome);
    }
  }, [outcome, onUnlocked]);

  return (
    <div className="baseline-flow">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <BaselineScreenShell key={1} reducedMotion={reducedMotion} variant="hero">
            <BaselineScreen1Hook onStart={handleStart} onSkip={handleSkip} />
          </BaselineScreenShell>
        )}
        {step === 2 && (
          <BaselineScreenShell key={2} reducedMotion={reducedMotion} variant="study">
            <BaselineScreen2Encoding onReady={() => go(3)} />
          </BaselineScreenShell>
        )}
        {step === 3 && (
          <BaselineScreenShell key={3} reducedMotion={reducedMotion} variant="quiz">
            <BaselineScreen3Recognition onCorrect={() => go(4)} />
          </BaselineScreenShell>
        )}
        {step === 4 && (
          <BaselineScreenShell key={4} reducedMotion={reducedMotion} variant="quiz">
            <BaselineScreen4Recall onComplete={handleRecallComplete} onMount={() => trackProductEvent('baseline_screen_4_start')} />
          </BaselineScreenShell>
        )}
        {step === 5 && outcome && (
          <BaselineScreenShell key={5} reducedMotion={reducedMotion} variant="reveal">
            <BaselineScreen5Reveal
              outcome={outcome}
              reducedMotion={reducedMotion}
              onComplete={handleRevealComplete}
            />
          </BaselineScreenShell>
        )}
      </AnimatePresence>
    </div>
  );
}
