import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import VeridianLoading from '@/components/shared/VeridianLoading';
import { getGenerationLoadingProfile } from '@/utils/ai/generationLoadingProfiles';
import { STUDY_DID_YOU_KNOW_FACTS } from '@/utils/ai/studyDidYouKnowFacts';
import { STUDY_MICRO_ACTIVITIES } from '@/utils/ai/studyMicroActivities';

const FACT_ROTATE_MS = 8000;

function pickRandomIndex(length, seed = Date.now()) {
  return Math.abs(seed) % length;
}

function LoadingSteps({ steps, activeStepIndex }) {
  if (!steps.length) return null;

  return (
    <ol className="ai-generation-loading-steps" aria-label="Generation progress">
      {steps.map((step, index) => {
        const isComplete = index < activeStepIndex;
        const isActive = index === activeStepIndex;
        const state = isComplete ? 'complete' : isActive ? 'active' : 'pending';

        return (
          <li
            key={step}
            className={`ai-generation-loading-step ai-generation-loading-step--${state}`}
          >
            <span className="ai-generation-loading-step-icon" aria-hidden="true">
              {isComplete ? <Check size={14} strokeWidth={2.5} /> : null}
            </span>
            <span className="ai-generation-loading-step-label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

function DidYouKnowFact({ factIndex }) {
  return (
    <blockquote className="ai-generation-loading-fact">
      <p className="ai-generation-loading-fact-label">Did you know?</p>
      <p className="ai-generation-loading-fact-text">{STUDY_DID_YOU_KNOW_FACTS[factIndex]}</p>
    </blockquote>
  );
}

function MicroActivity({ promptIndex }) {
  const [draft, setDraft] = useState('');

  return (
    <div className="ai-generation-loading-micro">
      <p className="ai-generation-loading-micro-prompt">{STUDY_MICRO_ACTIVITIES[promptIndex]}</p>
      <textarea
        className="ai-generation-loading-micro-input"
        rows={3}
        value={draft}
        placeholder="Optional — jot a thought here (not saved)"
        onChange={(e) => setDraft(e.target.value)}
        aria-label="Optional thinking space"
      />
    </div>
  );
}

/**
 * Unified loading UI for all AI generation flows.
 *
 * @param {Object} props
 * @param {string} props.action - Key into generationLoadingProfiles
 * @param {string} [props.label] - Override profile label
 * @param {string} [props.className]
 * @param {boolean} [props.fullPage]
 * @param {'default' | 'inline'} [props.variant]
 * @param {number} [props.activeStepIndex] - Long mode: 0-based index of the active step
 * @param {string} [props.progressDetail] - Extra detail, e.g. "Section 3 of 8"
 */
export default function AiGenerationLoading({
  action,
  label: labelOverride,
  className = '',
  fullPage = true,
  variant = 'default',
  activeStepIndex = 0,
  progressDetail = null,
}) {
  const profile = getGenerationLoadingProfile(action);
  const label = labelOverride ?? profile.label;
  const isLong = profile.mode === 'long' && variant !== 'inline';

  const [factIndex, setFactIndex] = useState(() => pickRandomIndex(STUDY_DID_YOU_KNOW_FACTS.length));
  const microIndex = useMemo(
    () => pickRandomIndex(STUDY_MICRO_ACTIVITIES.length),
    [],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setFactIndex((prev) => (prev + 1) % STUDY_DID_YOU_KNOW_FACTS.length);
    }, FACT_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  const rootClass = [
    'ai-generation-loading',
    isLong ? 'ai-generation-loading--long' : 'ai-generation-loading--short',
    variant === 'inline' ? 'ai-generation-loading--inline' : '',
    fullPage && variant !== 'inline' ? 'ai-generation-loading--full-page' : '',
    className,
  ].filter(Boolean).join(' ');

  if (variant === 'inline') {
    return (
      <div className={rootClass} role="status" aria-live="polite">
        <VeridianLoading size="sm" label={label} />
        <DidYouKnowFact factIndex={factIndex} />
      </div>
    );
  }

  if (isLong) {
    return (
      <div className={rootClass} role="status" aria-live="polite">
        <div className="ai-generation-loading-header">
          <VeridianLoading fullPage={false} />
          <p className="ai-generation-loading-label">{label}</p>
          {progressDetail && (
            <p className="ai-generation-loading-detail">{progressDetail}</p>
          )}
        </div>
        <LoadingSteps steps={profile.steps} activeStepIndex={activeStepIndex} />
        <DidYouKnowFact factIndex={factIndex} />
        <MicroActivity promptIndex={microIndex} />
      </div>
    );
  }

  const content = (
    <>
      <VeridianLoading label={label} />
      <DidYouKnowFact factIndex={factIndex} />
    </>
  );

  if (fullPage) {
    return (
      <div className={rootClass} role="status" aria-live="polite">
        <div className="ai-generation-loading-page">{content}</div>
      </div>
    );
  }

  return (
    <div className={rootClass} role="status" aria-live="polite">
      {content}
    </div>
  );
}
