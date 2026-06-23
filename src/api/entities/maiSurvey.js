import { createSurveyResponse } from '@/api/entities/surveyResponses';
import { updatePreferences } from '@/api/entities/preferences';
import { MAI_SURVEY_VERSION, computeMaiTotalScore } from '@/lib/survey/maiItems';

export async function submitMaiSurvey({
  surveyInstance,
  responses = [],
  wasSkipped = false,
  preferences,
}) {
  const now = Date.now();
  const accountAgeDays = preferences?.createdAt
    ? Math.floor((now - preferences.createdAt) / (24 * 60 * 60 * 1000))
    : 0;
  const totalScore = wasSkipped ? 0 : computeMaiTotalScore(responses);

  await createSurveyResponse({
    surveyVersion: MAI_SURVEY_VERSION,
    surveyInstance,
    responses: wasSkipped ? [] : responses,
    totalScore,
    accountAgeDays,
    wasSkipped,
    createdAt: now,
  });

  const prefPatch = {};
  if (surveyInstance === 'onboarding') {
    prefPatch.maiScoreOnboarding = wasSkipped ? null : totalScore;
    prefPatch.maiSurveyOnboardingCompletedAt = now;
  } else if (surveyInstance === 'day_60') {
    prefPatch.maiScoreDay60 = wasSkipped ? null : totalScore;
    prefPatch.maiSurveyDay60CompletedAt = now;
  }

  if (Object.keys(prefPatch).length) {
    await updatePreferences(prefPatch);
  }

  return { totalScore, accountAgeDays };
}

export async function dismissMaiDay60Survey() {
  return updatePreferences({ maiSurveyDay60DismissedAt: Date.now() });
}
