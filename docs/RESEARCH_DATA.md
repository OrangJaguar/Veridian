# Research Data Collection

This document describes research-oriented data fields, write paths, and admin exports added for thesis / calibration studies.

## Entities and fields

### Module (`base44/entities/Module.jsonc`)

| Field | Purpose |
|-------|---------|
| `baselineScore` | One-time demonstrated knowledge (0–100); never overwritten after set |
| `baselineCapturedAt` | UTC ms when baseline was captured |
| `baselineSkipped` | User skipped Starting Point Check |
| `firstQuizAt` | UTC ms of first completed quiz-type session on this module |

### Session `sessionData`

| Field | Purpose |
|-------|---------|
| `confidenceSlider` | `{ value: 0–100, submittedAt: ISO }` before every quiz / baseline |
| `baselineResults` | `[{ questionId, wasCorrect, difficultyEstimate }]` on baseline check |

### MasterySnapshot (new entity)

Snapshots at days 7, 30, 60 from `firstQuizAt`. One row per `(userEmail, moduleId, snapshotDay)`; never overwritten.

### SurveyResponse (new entity)

MAI self-report (`MAI_monitoring_v1`), instances `onboarding` and `day_60`.

### UserPreferences

| Field | Purpose |
|-------|---------|
| `maiScoreOnboarding` / `maiScoreDay60` | Total score 5–25 |
| `maiSurveyOnboardingCompletedAt` / `maiSurveyDay60CompletedAt` | Completion timestamps |
| `maiSurveyDay60DismissedAt` | Banner dismissed without completing |

## Write paths

1. **Confidence slider** — `PreQuizConfidenceStep` → `updateSession` before quiz; required on complete via `useCompleteSession` / diagnostic guard.
2. **Baseline** — Starting Point Check at `/journeys/:id/modules/:moduleId/baseline`; diagnostic backfill in `applyDiagnosticResults`.
3. **Mastery snapshots** — `runPostSessionEffects` after module mastery update.
4. **MAI survey** — `/mai-survey` after diagnostic summary (onboarding) and day-60 home banner.

## Quiz types requiring confidence slider

`practiceQuiz`, `diagnostic`, `interleavedReview`, `journeyChallenge`, `cramSession`, `baselineCheck`

## Admin research dashboard

Route: `/admin/research` (admin role required)

Server functions:

- `getResearchAnalytics` — data health, qualifying pairs, quality flags
- `exportResearchData` — CSV exports with `anonymized_user_id`

Set `RESEARCH_SALT` in Base44 function environment for export anonymization.

## Deployment checklist

1. Sync Base44 entity schemas: Module, UserPreferences, MasterySnapshot, SurveyResponse, Activity (`baselineCheck`).
2. Publish functions: `getResearchAnalytics`, `exportResearchData`.
3. Assign `role: admin` to research team accounts.
4. Set `RESEARCH_SALT` env var on server functions.
