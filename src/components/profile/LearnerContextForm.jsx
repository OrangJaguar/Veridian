import { useState, useEffect } from 'react';
import { useUpdatePreferences } from '@/hooks/mutations/usePreferencesMutations';
import {
  STUDY_GOAL_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  US_STATES,
  COUNTRY_OPTIONS,
} from '@/lib/geo/onboardingOptions';

export default function LearnerContextForm({ preferences }) {
  const updatePrefs = useUpdatePreferences();
  const [studyGoals, setStudyGoals] = useState(preferences?.studyGoals ?? []);
  const [gradeLevel, setGradeLevel] = useState(preferences?.gradeLevel ?? '');
  const [country, setCountry] = useState(preferences?.country ?? '');
  const [usState, setUsState] = useState(preferences?.usState ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStudyGoals(preferences?.studyGoals ?? []);
    setGradeLevel(preferences?.gradeLevel ?? '');
    setCountry(preferences?.country ?? '');
    setUsState(preferences?.usState ?? '');
  }, [preferences]);

  const toggleGoal = (goal) => {
    setStudyGoals((prev) => (
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    ));
    setSaved(false);
  };

  const handleSave = () => {
    updatePrefs.mutate({
      studyGoals,
      gradeLevel: gradeLevel || undefined,
      country: country || undefined,
      usState: country === 'United States' ? usState || undefined : undefined,
    }, {
      onSuccess: () => setSaved(true),
    });
  };

  return (
    <div className="learner-context-form">
      <div className="learner-context-field">
        <p className="learner-context-label">What are you studying for?</p>
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
      </div>

      <div className="learner-context-field">
        <label className="learner-context-label" htmlFor="profile-grade">Grade level</label>
        <select
          id="profile-grade"
          className="settings-input"
          value={gradeLevel}
          onChange={(e) => { setGradeLevel(e.target.value); setSaved(false); }}
        >
          <option value="">Select…</option>
          {GRADE_LEVEL_OPTIONS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="learner-context-field">
        <label className="learner-context-label" htmlFor="profile-country">Country</label>
        <select
          id="profile-country"
          className="settings-input"
          value={country}
          onChange={(e) => { setCountry(e.target.value); setSaved(false); }}
        >
          <option value="">Select…</option>
          {COUNTRY_OPTIONS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {country === 'United States' && (
        <div className="learner-context-field">
          <label className="learner-context-label" htmlFor="profile-state">State</label>
          <select
            id="profile-state"
            className="settings-input"
            value={usState}
            onChange={(e) => { setUsState(e.target.value); setSaved(false); }}
          >
            <option value="">Select…</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div className="learner-context-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={updatePrefs.isPending}
        >
          {updatePrefs.isPending ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="learner-context-saved">Saved</span>}
      </div>
    </div>
  );
}
