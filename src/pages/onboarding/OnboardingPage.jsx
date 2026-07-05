import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import VeridianLogo from '@/components/layout/VeridianLogo';
import { completeOnboarding, saveOnboardingProgress } from '@/api/entities/preferences';
import { markOnboardingDoneLocally } from '@/lib/onboardingStorage';
import { trackProductEvent } from '@/lib/analytics';
import { queryKeys } from '@/api/query-keys';
import { useAuth } from '@/hooks/useAuth';
import {
  STUDY_GOAL_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  US_STATES,
  COUNTRY_OPTIONS,
} from '@/lib/geo/onboardingOptions';

const STEP_COUNT = 5;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [studyGoals, setStudyGoals] = useState([]);
  const [gradeLevel, setGradeLevel] = useState('');
  const [country, setCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [usState, setUsState] = useState('');
  const [researchConsent, setResearchConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleGoal = (goal) => {
    setStudyGoals((prev) => (
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    ));
  };

  const resolvedCountry = country === 'Other' ? customCountry.trim() : country;

  const finish = async (patch = {}) => {
    setSaving(true);
    setError('');
    try {
      const updated = await completeOnboarding({
        studyGoals,
        gradeLevel: gradeLevel || undefined,
        country: resolvedCountry || undefined,
        usState: country === 'United States' ? usState || undefined : undefined,
        researchConsent,
        researchConsentAt: researchConsent ? Date.now() : undefined,
        onboardingStep: step,
        ...patch,
      });
      const completedAt = updated?.onboardingCompletedAt ?? Date.now();
      if (user?.email) markOnboardingDoneLocally(user.email);
      queryClient.setQueryData(queryKeys.preferences(user?.email), (prev) => ({
        ...(prev ?? {}),
        ...(updated ?? {}),
        onboardingCompletedAt: completedAt,
      }));
      await queryClient.refetchQueries({ queryKey: queryKeys.preferences(user?.email) });
      queryClient.setQueryData(queryKeys.preferences(user?.email), (prev) => (
        prev ? { ...prev, onboardingCompletedAt: prev.onboardingCompletedAt ?? completedAt } : prev
      ));
      trackProductEvent('onboarding_complete');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Onboarding completion failed:', err);
      setError('Could not save onboarding. Please try again.');
      setSaving(false);
    }
  };

  const skipAll = () => finish({ researchConsent: false });

  const goNext = async () => {
    const next = step + 1;
    if (next >= STEP_COUNT) {
      await finish();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveOnboardingProgress(step, {
        studyGoals,
        gradeLevel: gradeLevel || undefined,
        country: resolvedCountry || undefined,
        usState: country === 'United States' ? usState || undefined : undefined,
        researchConsent,
        researchConsentAt: researchConsent ? Date.now() : undefined,
      });
      setStep(next);
    } catch (err) {
      console.error('Onboarding progress save failed:', err);
      setError('Could not save onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-page">
      <button type="button" className="onboarding-skip" onClick={skipAll} disabled={saving}>
        Skip onboarding
      </button>

      <div className="onboarding-card">
        <VeridianLogo size={40} />

        {error && (
          <div className="auth-banner auth-banner-error onboarding-error">{error}</div>
        )}

        {step === 0 && (
          <>
            <h1 className="onboarding-title">Welcome to Veridian</h1>
            <p className="onboarding-lead">
              Veridian builds a personalized study plan from your material — with spaced repetition,
              practice quizzes, and clear daily recommendations.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="onboarding-title">What are you studying for?</h1>
            <p className="onboarding-lead">Select all that apply.</p>
            <div className="onboarding-chips">
              {STUDY_GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  className={`onboarding-chip${studyGoals.includes(goal) ? ' selected' : ''}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onboarding-title">What best describes you?</h1>
            <p className="onboarding-lead">Pick the option that fits you best.</p>
            <div className="onboarding-fields onboarding-step-body">
              <label className="veridian-form-field">
                Grade level
                <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                  <option value="">Select grade level</option>
                  {GRADE_LEVEL_OPTIONS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="onboarding-title">Where are you located?</h1>
            <div className="onboarding-fields onboarding-step-body">
              <label className="veridian-form-field">
                Country
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setUsState('');
                    if (e.target.value !== 'Other') setCustomCountry('');
                  }}
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              {country === 'Other' && (
                <label className="veridian-form-field">
                  Your country
                  <input
                    type="text"
                    value={customCountry}
                    placeholder="Enter your country"
                    onChange={(e) => setCustomCountry(e.target.value)}
                  />
                </label>
              )}
              {country === 'United States' && (
                <label className="veridian-form-field">
                  State
                  <select value={usState} onChange={(e) => setUsState(e.target.value)}>
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="onboarding-title">Help us improve Veridian</h1>
            <p className="onboarding-lead">
              We&apos;re conducting research on how students learn. If you agree, we may include your
              anonymized study patterns — like session length, quiz accuracy, and learning progression
              — in academic research. Your personal information is never shared. This is completely
              optional and you can change your preference anytime in settings.
            </p>
            <label className="auth-legal-checkbox onboarding-research-check">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(e) => setResearchConsent(e.target.checked)}
              />
              <span>I&apos;m happy to contribute my anonymized data to research</span>
            </label>
          </>
        )}

        <div className="onboarding-actions">
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={saving}>
            {saving ? 'Saving…' : step === STEP_COUNT - 1 ? 'Finish' : step === 0 ? 'Get started' : 'Continue'}
          </button>
        </div>

        <div className="onboarding-dots" aria-hidden="true">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
