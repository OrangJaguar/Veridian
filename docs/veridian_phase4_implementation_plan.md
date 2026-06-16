# Phase 4 — Journey Challenge & Cram Session

**Depends on:** Phase 1 (weekly plan), Phase 2 (journey scaffold), existing study shell + QuizRunner  
**Goal:** Ship two polished journey-wide activities that unlock when half the journey reaches Stage B, with setup UX matching practice quiz quality, distinct run behaviors, and summary screens that close the feedback loop.

**Exit criteria:** On a journey with ≥50% modules at Stage B/C, student can configure and complete a strict timed Journey Challenge (Focus Dial, 25/50/custom Qs, review flags, rich summary + plan callout) and a time-boxed Cram Session (module chips, growing green/red grid, light summary, Go Again CTA).

---

## v1 scope (locked)

| Include | Skip for v1 |
|---------|-------------|
| Journey Challenge setup modal (Qs, Focus Dial, time/Q) | Interleaved review redesign |
| Strict timed challenge run (QuizRunner) | Per-question timer on cram |
| Review flags on challenge only | Flag persistence across refresh |
| JourneyChallengeSummary (module bars, deltas, plan callout) | AI-generated summary prose |
| New `cramSession` activity type + setup modal | Home page redesign |
| CramRunner: session timer + growing grid | Real-time AI question streaming |
| CramSessionSummary + Go Again | Full Learning Profile analytics |
| Unlock at half modules Stage B/C | Ratings, social features |
| Non-AI personalization (preview, reweight, deltas) | New AI personalization models |

**User decision:** Cram is a **separate journey-scoped activity type** (`cramSession`), not a `cramMode` flag on `journeyChallenge`.

---

## Entity changes

### `Activity` — new type `cramSession`

| File | Change |
|------|--------|
| [`base44/entities/Activity.jsonc`](../base44/entities/Activity.jsonc) | Add `cramSession` to type enum |
| [`src/utils/schemas/activity.js`](../src/utils/schemas/activity.js) | Zod mirror |
| [`src/api/entities/journeyScaffold.js`](../src/api/entities/journeyScaffold.js) | Scaffold activity |
| [`src/api/entities/ensureJourneyActivities.js`](../src/api/entities/ensureJourneyActivities.js) | Lazy-create for existing journeys |

### `Journey` — `moduleFocusBoosts`

| Field | Type | Purpose |
|-------|------|---------|
| `moduleFocusBoosts` | `Record<moduleId, number>` | Temporary urgency weights from last challenge (0–3 scale) |

Files: [`base44/entities/Journey.jsonc`](../base44/entities/Journey.jsonc), [`src/utils/schemas/journey.js`](../src/utils/schemas/journey.js)

Consumed in [`moduleUrgency.js`](../src/utils/weeklyPlan/moduleUrgency.js) via [`moduleContext.js`](../src/utils/weeklyPlan/moduleContext.js).

### Session data schemas

Extended in [`src/utils/schemas/sessions/index.js`](../src/utils/schemas/sessions/index.js):

**Journey challenge `sessionData`:** `challengeConfig`, `questions`, `answers`, `flaggedIndices`, `perModuleAccuracy`, `perModuleMissedConcept`, `planReweighted`, `totalTimeSec`, `timeRemainingSec`.

**Cram `sessionData`:** `cramConfig`, `questions`, `answers`, `hardestConceptTag`, `perModuleAccuracy`, `itemsCompleted`, `totalTimeSec`.

---

## Unlock gate

[`src/utils/study/journeyUnlock.js`](../src/utils/study/journeyUnlock.js):

- `journeyWideActivitiesUnlocked(modules)` — `ready >= ceil(total / 2)` where ready = Stage B or C
- `cramEligibleModules(modules)` — Stage B/C only

Wired into:
- [`JourneyLevelActions.jsx`](../src/components/journey-detail/JourneyLevelActions.jsx)
- [`HomeExamCramZone.jsx`](../src/components/home/HomeExamCramZone.jsx)

---

## Journey Challenge

### Setup — [`JourneyChallengeSetupModal.jsx`](../src/components/study/quiz/JourneyChallengeSetupModal.jsx)

| Control | Saved as |
|---------|----------|
| Questions 25 / 50 / Custom (1–100) | `questionCount` |
| Focus Dial slider 0.0→1.0 | `focusWeight` |
| Live preview row per module | `moduleDistributionPreview` (client only) |
| Time per question 30s / 1m / 2m | `strictSecondsPerQuestion` |
| Strict mode | always `true` |

Focus distribution: [`challengeDistribution.js`](../src/utils/study/challengeDistribution.js) → `moduleTargets` for AI.

### Session — [`JourneyChallengeSession.jsx`](../src/pages/study/modes/JourneyChallengeSession.jsx)

Phase machine: `setup` → `loading` → `active` → `summary`

- **active:** `QuizRunner` with `strictMode`, `strictTimedMode`, `strictSecondsPerQuestion`
- **complete:** `computePerModuleAccuracy`, `computePerModuleMissedConcept`, `applyChallengePlanBoost`, `computeChallengeDeltas`

### Summary — [`JourneyChallengeSummary.jsx`](../src/components/study/quiz/JourneyChallengeSummary.jsx)

Accuracy + total time + unused strict time, module breakdown (worst-first), last-challenge deltas, plan callout, optional review expand.

### AI — `generateJourneyChallenge`

Payload: `focusWeight`, `moduleTargets`, `moduleMaps` (replaces `weighting: balanced|weak`).

Prompts: [`base44/functions/geminiStudy/entry.ts`](../base44/functions/geminiStudy/entry.ts), [`entry/entry.ts`](../base44/functions/geminiStudy/entry/entry.ts).

---

## Cram Session

### Setup — [`CramSessionSetupModal.jsx`](../src/components/study/cram/CramSessionSetupModal.jsx)

| Control | Saved as |
|---------|----------|
| Time 5 / 15 / 30 min + Custom (1–60) | `durationMin` |
| Module chips (Stage B/C) | `selectedModuleIds` |

Default selection: weakest modules (quiz accuracy < 50%).

### Pool size — [`computeCramPoolSize.js`](../src/utils/study/computeCramPoolSize.js)

`ceil(durationMin * 60 / 90)`, min 5, max 40.

### Runner — [`CramRunner.jsx`](../src/components/study/cram/CramRunner.jsx)

- Session countdown timer (auto-complete at 0)
- Instant feedback per question
- No review flags
- [`CramQuestionNav.jsx`](../src/components/study/cram/CramQuestionNav.jsx) — green/red/gray grid

### Summary — [`CramSessionSummary.jsx`](../src/components/study/cram/CramSessionSummary.jsx)

Questions answered, total time, hardest concept, module dot chips, **Go again** primary CTA.

### Session — [`CramSession.jsx`](../src/pages/study/modes/CramSession.jsx)

Phase machine: `setup` → `loading` → `active` → `summary`. Go Again relaunches via `useLaunchStudy` with same `cramConfig`.

### AI — `generateCramSession`

Payload: `selectedModuleIds`, `moduleMaps`, `questionCount`, `weakConceptIds`.

---

## Non-AI personalization

| Feature | File |
|---------|------|
| Focus Dial preview | `challengeDistribution.js` |
| Cram module pre-select | `CramSessionSetupModal` |
| Last challenge delta | `challengeHistory.js` |
| Plan reweight | `applyChallengePlanBoost.js` → `moduleFocusBoosts` + `rebuildWeeklyPlan` |
| Exam context in modals | both setup modals when `journey.examDate` set |

---

## Routing & launch

| File | Change |
|------|--------|
| [`StudyShell.jsx`](../src/pages/study/StudyShell.jsx) | Route `cramSession` → `CramSession`; removed `cramMode` hijack |
| [`JourneyLevelActions.jsx`](../src/components/journey-detail/JourneyLevelActions.jsx) | Three cards: Interleaved, Challenge, Cram |
| [`HomeExamCramZone.jsx`](../src/components/home/HomeExamCramZone.jsx) | Quick-start 15 min cram |
| [`QuizRunner.jsx`](../src/components/study/quiz/QuizRunner.jsx) | `onComplete(answers, time, { flaggedIndices })` |
| [`normalizeQuizQuestions.js`](../src/utils/study/normalizeQuizQuestions.js) | Optional `moduleId` + `moduleTargets` fallback |

---

## Component prop contracts

### `JourneyChallengeSetupModal`

```js
{ open, modules, activities, journey, onClose, onStart(challengeConfig), loading }
```

### `JourneyChallengeSummary`

```js
{ questions, answers, modules, perModuleAccuracy, perModuleMissedConcept,
  totalTimeSec, timeRemainingSec, challengeDeltas, planReweighted, focusModules, returnHref }
```

### `CramSessionSetupModal`

```js
{ open, modules, activities, journey, onClose, onStart(cramConfig), loading }
```

### `CramRunner`

```js
{ questions, durationMin, onComplete(answers, totalTimeSec), onExit }
```

### `CramSessionSummary`

```js
{ answers, modules, selectedModuleIds, perModuleAccuracy, hardestConceptTag,
  totalTimeSec, returnHref, onGoAgain }
```

---

## CSS

Phase 4 block in [`src/css/app.css`](../src/css/app.css):

- `.journey-challenge-setup-modal`, `.focus-dial`, `.focus-dial-preview`
- `.journey-challenge-summary`, `.module-breakdown-row`, `.module-accuracy-bar`, `.challenge-delta`, `.plan-callout`
- `.cram-setup-modal`, `.cram-module-chips`, `.cram-runner`, `.cram-nav-cell.correct/.wrong`
- `.cram-summary`, `.cram-module-dots`, `.cram-go-again`

---

## Testing checklist

- [ ] Journey with 3/6 modules at Stage B unlocks; 2/6 stays locked
- [ ] Challenge setup: Focus Dial preview updates while dragging
- [ ] Challenge: strict timer enforced; auto-submit at 0; review flags work
- [ ] Challenge summary: module bars sorted worst-first; delta vs last run; plan callout when reweighted
- [ ] Cram: module chips default all B/C; time picker works
- [ ] Cram: session timer ends run; grid shows green/red; no strict per-Q timer
- [ ] Cram summary: hardest topic correct; Go Again relaunches
- [ ] `cramMode` flag path removed; `cramSession` routes correctly
- [ ] Weekly plan reflects boosted weak module after challenge
- [ ] `npm run build` passes

---

## Base44 publish checklist

1. Publish `Activity.jsonc` (`cramSession` type)
2. Publish `Journey.jsonc` (`moduleFocusBoosts`)
3. Deploy updated `geminiStudy` prompts (`focusWeight`, `moduleTargets`, cram selected modules)
4. Existing journeys: verify lazy scaffold creates `cramSession` activity

---

## Deferred beyond Phase 4

- Interleaved review setup/summary polish
- Cram mid-session AI top-up batches
- Flag persistence across session resume
- Due Today surfacing of journey-wide activities
- Home page layout changes from original PDF
