# Planner Prescription Execution

Plan 4 closes the loop: failure evidence drives planner assignment, Due Today launches prescription-aware sessions, and activity runners honor the matrix.

## Naming: Exam week vs Cram Session

| Term | What it is |
|------|------------|
| **Exam week** | Planner packing mode when a journey’s exam is ≤7 days (`examWeek`; legacy stored `cram` still reads). Denser per-journey packing — **does not** collapse the whole user calendar to today. |
| **Cram Session** | Journey-wide **activity** (`cramSession`) — short weak-module sprint. Name unchanged. |
| **Journey Challenge** | Journey-wide **activity** — timed exam-style assessment across the journey. |
| **Interleaved Review** | **Retired** as a product surface. Not scaffolded on new journeys; not assigned by the planner. Legacy sessions still open in StudyShell. |

## Flow

```
postSession → ingestEvidence → shouldRebuildAfterEvidence → rebuildGlobalPlan
buildModuleContext → pickPrescriptionAssignment → allocateGlobalDay → getDueTodayItems
useLaunchDueItem → buildLaunchSessionData → useLaunchStudy → activity session
```

## Core modules

| File | Role |
|------|------|
| [`pickPrescriptionAssignment.js`](../src/utils/planner/pickPrescriptionAssignment.js) | `resolveModulePrescription` → activity + reason + launch config |
| [`assignActivityType.js`](../src/utils/weeklyPlan/assignActivityType.js) | Prescription first, heuristic fallback |
| [`allocateGlobalDay.js`](../src/utils/planner/allocation/allocateGlobalDay.js) | Per-journey exam-week / keep-sharp consecutive-day rules; prescription fields on assignments |
| [`buildGlobalPlan.js`](../src/utils/planner/buildGlobalPlan.js) | Always 7-day week grid; `examWeekByJourneyId` + `keepSharpByJourneyId` |
| [`pacingMode.js`](../src/utils/planner/pacingMode.js) | `examWeek` / `keepSharp` / `normal` from exam date; global mode prefers exam week |
| [`getDueTodayItems.js`](../src/utils/dueToday/getDueTodayItems.js) | Profile focus tier, prescription copy, launch fields |
| [`formatDueItemPresentation.js`](../src/utils/dueToday/formatDueItemPresentation.js) | Focus / Due row: activity + reason (no names) + `Journey · Module` once |
| [`buildLaunchSessionData.js`](../src/utils/planner/buildLaunchSessionData.js) | Due item → `initialSessionData` |
| [`shouldRebuildAfterEvidence.js`](../src/utils/planner/shouldRebuildAfterEvidence.js) | Plan rebuild triggers after evidence ingest |

## Reason codes

Prescription assignments use `rx_*` reason codes (see [`reasonCopy.js`](../src/utils/planner/reasonCopy.js)):

- `rx_transfer_drill` — Transfer fix
- `rx_verbatim_variation` — Wording variation quiz
- `rx_verbatim_flashcards` — Mixed phrasing flashcards (verbatim_trap + flashcard rotation)
- `rx_pressure_timed_drill` — Timed drill
- `rx_retention_spaced_review` — Due-card spaced review
- `rx_interference_discrimination` — Discrimination practice
- `rx_understanding_quiz` / `rx_understanding_guide`

When `prescriptionSummary` is set, Due Today / Focus uses `formatDueItemPresentation` (summary as reason; module only on context line).

## Focus tier priority

1. **Profile focus** — confirmed primary mode, module not studied in 48h (`getProfileFocusModule`)
2. **Diagnostic focus** — fresh baseline (<24h, no `lastStudiedAt`)
3. First planner assignment (budget tiers)

## Advanced features

### Evidence-driven replan

[`postSession.js`](../src/utils/study/postSession.js) rebuilds the global plan when:

- Stage promotion (A→B, B→C)
- Primary mode changes
- Confidence upgrades emerging → confirmed
- Confirmed pattern trend becomes worsening

Debounced to 5 minutes via `preferences.lastEvidencePlanRebuildAt`.

### Urgency boost

[`moduleUrgency.js`](../src/utils/weeklyPlan/moduleUrgency.js) prioritizes modules with confirmed (-90) or emerging (-40) failure profiles; extra -50 when worsening.

### Prescription fatigue

If the same `prescriptionType` was assigned 2+ times this week, `pickPrescriptionAssignment` rotates to the secondary mode when emerging+.

### Exam week (per journey)

When `isExamWeek(examDate)` (≤7 days future):

- That journey may be assigned on consecutive calendar days (spacing skip skipped).
- Other journeys keep consecutive-day spacing.
- Global prefs `globalPlanMode` is `examWeek` if **any** active journey qualifies (status signal only).
- Per-journey `weeklyPlanMode` is `examWeek` only for journeys that qualify.
- Writers emit `examWeek`; readers accept legacy `cram` via `normalizePlanMode`.

### Keep sharp (open / past exam)

When `examDate` is null **or** in the past (`resolveJourneyPacingMode` → `keepSharp`):

- Wider consecutive spacing (skip if last assigned within 2 days)
- Lower budget share vs exam-near journeys; min touches **1**/week
- Prefer flashcards / retention when competing
- Projection mode + week strategy: light spaced practice
- Global `keepSharp` only when **all** active journeys are keepSharp; exam week still wins in a mix
- Create/clone UI: optional exam; Home **Keep sharp** strip; journey detail **Set exam date** to leave keepSharp

Open journeys do **not** use Journey Challenge CTAs from the keep-sharp strip.

### Flashcard execution

[`FlashcardSession.jsx`](../src/pages/study/modes/FlashcardSession.jsx) honors `flashcardMode: 'due'` from planner/prescription and filters cards via FSRS due schedule.

## Assignment shape

Plan assignments and Due Today items include:

```js
{
  prescriptionType, primaryMode, prescriptionSummary,
  prescription, quizConfig, flashcardMode, mixedPhrasing,
  timed, prescriptionDriven, journeyLevel
}
```

## Tests

- `pickPrescriptionAssignment.test.js`
- `assignActivityType.test.js`
- `failureModeToActivity.test.js`
- `buildLaunchSessionData.test.js`
- `shouldRebuildAfterEvidence.test.js`
- `prescriptionPlannerLoop.test.js`
- `getDueTodayItems.test.js` (prescription fields)
- `buildGlobalPlan.test.js` (mixed exam week week grid)
- `formatDueItemPresentation.test.js`
