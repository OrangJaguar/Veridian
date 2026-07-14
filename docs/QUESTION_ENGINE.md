# Question Engine (Plan 2)

Plan 2 expands Veridian quizzes from MCQ-only to a **prescription-aware composition engine** with six interaction types.

## Question types

| Type | Response | Notes |
|------|----------|-------|
| `multipleChoice` | string | 4 options; supports `variantType` |
| `trueFalse` | string | True / False |
| `shortAnswer` | string | Fuzzy or exact match |
| `multiSelect` | string[] | Select all that apply |
| `ordering` | string[] | Up/down reorder (accessible) |
| `matching` | Record<string,string> | Term → definition dropdowns |

Metadata on all types: `conceptId`, `variantType`, `mixCategory`.

Implementation: [`src/utils/quiz/questionSchemas.js`](src/utils/quiz/questionSchemas.js), [`gradeQuestionResponse.js`](src/utils/quiz/gradeQuestionResponse.js).

## Composition planner

[`buildQuizCompositionPlan.js`](src/utils/quiz/buildQuizCompositionPlan.js) decides **which types appear** in each session — not every type in every quiz.

**Inputs:** module stage, failure profile, prescription spec, concepts, quiz registry, session history.

**Rules:**
- Stage A: max 2 types (MCQ + T/F)
- Stage B: max 3 types; matching when discrimination prescribed
- Stage C: max 4 types; ordering allowed on procedural concepts
- Prescription `questionMix` scales to `questionCount`
- Fatigue: avoid repeating matching if overused recently

Category → type mapping: [`mapMixCategoryToTypes.js`](src/utils/quiz/mapMixCategoryToTypes.js)

## Prescription flow

1. `resolveModulePrescription(module)` — profile + stage → spec
2. `buildQuizCompositionPlan(...)` — spec → slot manifest
3. AI or bank fills slots
4. Session stores `prescription` + `compositionPlan`; planner passes prescription via `buildLaunchSessionData`

Wired in [`PracticeQuizSession.jsx`](src/pages/study/modes/PracticeQuizSession.jsx). Planner launch path in Plan 4: [`PLANNER_PRESCRIPTIONS.md`](PLANNER_PRESCRIPTIONS.md).

## UI

Classic runner uses [`QuizQuestionView`](src/components/study/quiz/QuizQuestionView.jsx) + [`QuizAnswerInput`](src/components/study/quiz/inputs/QuizAnswerInput.jsx).

AP Classroom preset auto-falls back to classic when composition includes non-MCQ types.

## Question banks

Certified journeys / clones with a bank: [`sampleQuestionBank.js`](src/utils/study/sampleQuestionBank.js) — composition-aware sampling.

**Bank-first UX (product Plan 3):** When `shouldUseQuestionBank` is true, Practice Quiz skips [`AiGenerationLoading`](../src/components/shared/AiGenerationLoading.jsx) and surfaces [`QuizContentSourceBadge`](../src/components/study/quiz/QuizContentSourceBadge.jsx) (“Using your question bank · No wait”). Setup modal shows the same hint before start.

**Prescription top-up:** Confirmed prescriptions call [`queuePrescriptionBankTopUp.js`](../src/utils/planner/queuePrescriptionBankTopUp.js) → `generateQuestionBankSlice` on [`aiStudy`](../base44/functions/aiStudy/entry.ts), append 5–10 tagged items (cap 80), 24h idempotency per `prescriptionType`. Best-effort; optional toast on success. **Republish `aiStudy` after server changes.**

Admin editor: type picker, variant/mix tags, conditional fields per type.

## AI generation + quality gates

Prompts accept `compositionSlots` in [`practiceQuiz.js`](src/api/ai/prompts/practiceQuiz.js) and [`aiStudy/entry.ts`](../base44/functions/aiStudy/entry.ts).

Client gates: [`validateGeneratedQuestions.js`](../src/utils/quiz/validateGeneratedQuestions.js) — thin/meta stems, duplicate options, near-dupe stems, incomplete matching/ordering. One quality retry with avoid stems + `improvePracticeQuestions` loader profile before soft failure.

Server: `finalizeQuestionsOutput` drops empty/meta stems similarly.

## Evidence

Practice misses use `variantType` when present. Matching → `interference`; ordering → `understanding_gap`.

See also: [`FAILURE_PROFILE.md`](FAILURE_PROFILE.md) for Plan 2 `questionMix` execution.
