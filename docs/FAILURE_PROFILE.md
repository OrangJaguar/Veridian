# Failure Profile Foundation

Plan 1 establishes Veridian's algorithmic failure-mode detection: continuous evidence ingestion, profile computation, and a prescription matrix spec for Plans 2–4.

## Canonical taxonomy (5 modes + retention)

| ID | User label | Absorbs |
|----|------------|---------|
| `understanding_gap` | Understanding gap | conceptual + procedural gaps |
| `verbatim_trap` | Verbatim trap | surface recall without flexible understanding |
| `transfer_failure` | Transfer failure | low performance on novel scenarios |
| `interference` | Interference | cross-concept confusion |
| `pressure_collapse` | Pressure collapse | timed vs untimed accuracy gap |
| `retention_decay` | Retention decay | lapses on previously solid material |

Metadata lives in `src/utils/failures/taxonomy.js`. Legacy diagnostic signals map via `src/utils/failures/legacyFailureMap.js`.

## Persistence

- **`Module.failureEvidence`** — versioned JSON blob (`version: 1`) holding living evidence.
- **`Module.moduleDiagnosticSummary`** — legacy baseline snapshot; still read for backward compatibility.

Evidence shape:

```ts
// ConceptEvidence: { conceptId, modes: { [modeId]: { hits, lastAt, samples[] } } }
// ModuleFailureEvidence: { version, concepts, moduleLevel, processedSessionIds, updatedAt }
```

API: `src/api/entities/failureEvidence.js`

- `loadModuleFailureEvidence(module)`
- `saveModuleFailureEvidence(moduleId, evidence)`
- `ingestSessionEvidence({ module, session, activity, cards })`
- `ingestDiagnosticEvidence({ module, placement, sessionId })`
- `backfillModuleEvidence(module, sessions, cards)` — replays last 20 sessions + legacy summary when empty

## Evidence extraction rules

Pure, algorithm-only extraction. Idempotent per session via `processedSessionIds` (max 50).

### Diagnostic / baseline

`extractEvidenceFromDiagnostic.js` ports variant-stats logic:

- High verbatim + low application/transfer → `verbatim_trap`
- Low transfer + decent verbatim → `transfer_failure`
- All variant accuracies low → `understanding_gap`
- Legacy `failureSignals` mapped to canonical IDs
- +2 hits per detected mode on weakest concept; +1 module-level hit

### Practice quiz

- Wrong + `variantType: verbatim` → `verbatim_trap`
- Wrong + `application`/`transfer` → `transfer_failure`
- Wrong without variant → `understanding_gap`
- Adjacent concept miss streak → `interference`
- Timed quiz misses → `pressure_collapse`

### Flashcard set

- `again` rating → `retention_decay`
- 3+ `again` on same concept in one session → weak `verbatim_trap`

### Learning guide

- Failed check-in → `understanding_gap`

### Feynman

- `confidencePercent < 40` → strong `understanding_gap` (+2)
- `confidencePercent < 60` → weak `understanding_gap` (+1)

### Free recall

- `missed`/`incorrect` coverage → `understanding_gap`
- `partial` with hints → weak `verbatim_trap`

## Profile computation

`computeFailureProfile(module)` reads `failureEvidence` and returns:

```js
{
  primaryMode, secondaryMode,
  rankedModes: [{ modeId, score, rawHits, confidence, conceptCount }],
  topConcepts: [{ conceptId, label, modeId, hits, confidence }],
  evidenceSessionCount, lastUpdatedAt, hasData, trend, primaryConfidence
}
```

### Scoring

- Mode score = sum of concept hits, ×1.5 if `lastAt` within 7 days
- **Emerging:** hits ≥ 2 (`EMERGING_EVIDENCE_HITS`)
- **Confirmed:** hits ≥ 4 (`CONFIRMED_EVIDENCE_HITS`)
- `primaryMode` = highest-scoring mode with emerging+ confidence
- `trend`: compare sample counts in last 7d vs prior 7d (`improving` / `stable` / `worsening`)

### Journey rollup

`computeJourneyFailureRollup(journey, modules)` counts modules per primary mode and surfaces top 3 journey-level concerns.

## Prescription matrix (spec only)

`src/utils/failures/prescriptionMatrix.js` defines `failureMode × stage → PrescriptionSpec`.

Stages: `A`, `B`, `C`. Not executed by the planner in Plan 1.

| Mode | Stage A | Stage B | Stage C |
|------|---------|---------|---------|
| understanding_gap | learningGuide | practiceQuiz (understanding mix) | feynman |
| verbatim_trap | learningGuide | practiceQuiz (application + transfer) | feynman |
| transfer_failure | learningGuide | practiceQuiz (transfer drill) | freeRecall |
| interference | learningGuide | practiceQuiz (discrimination) | feynman |
| pressure_collapse | learningGuide | practiceQuiz (timed) | practiceQuiz (timed) |
| retention_decay | learningGuide | flashcardSet (due) | flashcardSet (due) |

Helpers:

- `getPrescriptionForMode(modeId, stage)`
- `getPrescriptionSummary(spec)`
- `allMatrixCellsFilled()` — validation helper for tests

## Plan 2 execution (`questionMix`)

Plan 2 wires B-stage `questionMix` into quiz generation via [`buildQuizCompositionPlan`](../src/utils/quiz/buildQuizCompositionPlan.js):

| mixCategory | Typical question types |
|-------------|------------------------|
| `understanding` | MCQ + shortAnswer + T/F |
| `application` | MCQ (`variantType: application`) |
| `transfer` | MCQ + shortAnswer |
| `discrimination` | matching |
| `review` | MCQ + T/F |

See [`QUESTION_ENGINE.md`](QUESTION_ENGINE.md) for full composition rules and UI details.

## Plan 3 UI surfaces

Plan 3 makes failure profiles visible to students with scannable visuals and unified copy.

### Copy source

- **Canonical taxonomy:** [`taxonomy.js`](../src/utils/failures/taxonomy.js) — `title`, `summary`, `studentExplanation`, `detectionCopy`, `iconKey`
- **Landing grid:** [`buildLandingFailuresContent.js`](../src/utils/failures/buildLandingFailuresContent.js) — derives Six Failures cards from taxonomy (no hand-edited drift)
- **User-facing formatters:** [`formatFailureCopy.js`](../src/utils/failures/formatFailureCopy.js)

### Shared components (`src/components/failures/`)

| Component | Used on |
|-----------|---------|
| `FailureModeIcon` / `FailureModeBar` | Module profile, journey chart, landing |
| `FailureProfileRankedModes` | Module detail card |
| `FailureProfileConcepts` | Module detail card |
| `FailureProfilePrescriptionPreview` | Module detail (read-only; uses `useModulePrescription`) |
| `JourneyFailureModeChart` / `JourneyFailureModuleList` | Journey detail rollup |
| `ModuleFailureModePill` | Journey module list |
| `SessionFailureInsight` | Quiz summary footer |
| `DueItemFailureHint` | Home Focus Now / Due Today rows (display-only) |

### Read-only vs Plan 4 execution

| Surface | Plan 3 behavior | Plan 4 (live) |
|---------|-----------------|-----------------|
| Module prescription preview | Shows `getPrescriptionSummary` + scroll-to-activity CTA | Planner auto-assigns matching activities |
| Quiz setup badge | Targeting copy (Plan 2) | Same, driven by assignment + Start button |
| Due Today | Prescription summary on items | `assignActivityType` + profile focus tier |
| Post-session insight | One-line pattern feedback | Evidence → debounced plan rebuild |

Prescription execution details: [`PLANNER_PRESCRIPTIONS.md`](PLANNER_PRESCRIPTIONS.md). Quiz composition: [`QUESTION_ENGINE.md`](QUESTION_ENGINE.md).

## Journey-wide activities

After Exam Week Clarity (product Plan 1):

| Activity | Role |
|----------|------|
| **Journey Challenge** | Timed exam-style assessment across the journey |
| **Cram Session** | Duration-boxed weak-module prep sprint |
| **Interleaved Review** | **Retired** — not scaffolded; not planner-assigned; StudyShell keeps legacy resume |

**Exam week** is planner packing (exam ≤7 days), not the Cram Session activity. See [`PLANNER_PRESCRIPTIONS.md`](PLANNER_PRESCRIPTIONS.md).

## Product Plan 2 — Soft diagnosis + new-user path

Product Plan 2 (not Question Engine Plan 2) softens in-app diagnosis tone and Focus-first onboarding:

| Area | Behavior |
|------|----------|
| **Copy** | Empty/warming/confidence/trend/session strings use patterns / signals / practice — never “you failed” |
| **Prescription CTA** | Module profile primary button **Start tonight’s practice** launches the same session Due Today would (`resolveTonightPrescriptionLaunch`) |
| **Stage A** | Honesty line: guide first so early practice isn’t random |
| **Sample path** | Empty home / journeys + create welcome → sample Library / ready-made journeys; clone lands on `/home` |
| **First session ready** | Compact Home strip when a new journey has Focus work and ≤2 completed sessions |
| **Day-1 journey-wide** | Locked Challenge + Cram collapse to one callout; Interleaved stays retired |
| **Taxonomy** | Full explainer hidden on empty profiles; collapsed by default when profile has data |

**Product Plan 3 (content / wait / keep-sharp):** bank-first practice quiz, quality gates + retry, prescription bank top-up, open journeys, Keep sharp pacing + home strip, unarchive — **done**. Educator accounts still deferred.

## Integration points

- **Post-session:** `postSession.js` → `ingestSessionEvidence`
- **Diagnostic:** `applyModuleDiagnosticResults.js` → `ingestDiagnosticEvidence`
- **Planner context:** `moduleContext.js` adds `failureProfile`, `primaryFailureMode`
- **Weakness adapter:** `diagnosticWeakness.js` accepts legacy + canonical modes
- **Query invalidation:** `useCompleteSession.js` invalidates `failureProfile` queries
- **Planner execution:** `pickPrescriptionAssignment` → `allocateGlobalDay` → `getDueTodayItems` → `buildLaunchSessionData`
- **Tonight’s CTA:** `resolveTonightPrescriptionLaunch` → `useLaunchDueItem` / `buildLaunchSessionData`
- **Library privacy:** clone omits `failureEvidence`; `stripModulePrivateFields` for public exposure
