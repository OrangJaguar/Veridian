
# Veridian — Phase 1 Build Brief
## Study Plan Engine v2 + True FSRS + Daily Budget System

Read this entire document before writing any code or making a task list. This is a product and systems brief, not a code spec. Your job after reading this is to produce a detailed technical task list and implementation plan, then get approval before touching any files.

---

## The Core Problem to Solve

The current study plan is a static AI-generated text block that says the same generic things to every user. Due Today surfaces every eligible activity at once, leading to 10+ item dumps that are overwhelming and scientifically wrong. The goal of Phase 1 is to replace all of this with a deterministic, math-based scheduling engine that gives each user a focused, personalized daily scope — no AI tokens involved in any of this computation.

---

## What Needs to Change

### 1. The Weekly Plan Engine (new, core system)

Build a weekly plan engine that runs once per week and produces a 7-day schedule. This is a pure JavaScript computation — no API calls, no AI, no tokens. It reads existing data about modules, activities, sessions, and cards and outputs a structured day-by-day assignment map.

The engine needs to do the following:

**Inputs it uses:**
- Each module's current stage (A, B, or C)
- Each module's last quiz accuracy (if any sessions exist)
- Whether the learning guide for each module has been completed
- The journey's exam date and therefore days until exam
- Which activities have already been completed this week
- The user's daily time budget preference (default 35 minutes, adjustable later in Settings)
- Weak concept tags from recent sessions if available

**What it produces:**
- A map of which module and which activity type is assigned to each day of the week
- An estimated time in minutes for each day's total load
- A summary of why each module was prioritized the way it was (used for the UI text, not AI-generated)

**The rotation logic:**
- Take all active modules and sort them by urgency. Urgency is determined by: low accuracy first, then closest exam, then stage (Stage B modules are more urgent than Stage A that hasn't started)
- Deal the sorted modules across the 7 days like a card deck so no module gets two non-card activity slots in the same day
- Each day gets at most one non-FSRS activity assignment per journey (two during exam crunch mode)
- FSRS card reviews are appended to every day that has due cards — they are never assigned or rotated, they just appear when mathematically due
- Stage A modules that have not yet completed their learning guide get only one possible assignment: "complete the learning guide." No quizzes, no flashcards, no Feynman until the guide is done. This is a hard gate.
- Stage B modules get quiz or flashcard deck review slots depending on their accuracy and how many days since last quiz
- Stage C modules get Feynman or Free Recall slots, interleaved with light FSRS review

**Rebuild triggers:**
- A new week starts (Monday)
- A module changes stage
- The user manually triggers a replan from the journey detail page
- The journey's exam date changes
- Otherwise the plan is read from storage, not recomputed

**Storage:**
- Persist the weekly plan snapshot on the Journey record or a lightweight companion record
- React Query reads and caches it — no recomputation on every page load
- The plan stores the week it was built for so stale plans are detected and rebuilt automatically

---

### 2. Cram Mode (separate branch of the engine)

When the exam is 7 days away or fewer, the weekly plan engine switches to cram mode. In cram mode:

- Module rotation is abandoned — every active module gets attention every day
- Daily budget expands to approximately 60 minutes
- Modules are ordered strictly by urgency (weakest accuracy first)
- The plan rebuilds daily instead of weekly
- The UI shows a cram mode indicator so the user knows the plan has intensified

This is a distinct branch in the engine logic, not just a multiplier.

---

### 3. Due Today (replace the current implementation)

Due Today currently shows everything that is eligible. Replace it entirely with a scoped view that reads only from the weekly plan.

**New logic:**
- Read today's assigned non-FSRS activity from the weekly plan (this is 0 or 1 items per journey)
- Read FSRS cards that are mathematically due today up to the daily card budget cap
- If the user has multiple journeys, each contributes at most 1 non-card item unless in cram mode
- Total estimated time is calculated from a fixed activity time lookup (guide = 20 min, quiz = 15 min, flashcard deck = 10 min, free recall = 12 min, Feynman = 15 min)
- If total time exceeds the user's budget, overflow items go into a collapsed "Also today" section — they are not hidden, just de-emphasized
- The primary item (most urgent, first in the sorted list) is surfaced as the Focus Now card at the top
- The header shows "Today's plan · ~[X] min" where X is the computed total

---

### 4. True FSRS Card Scheduling

Cards currently surface based on raw eligibility. Replace with true FSRS behavior:

- Each card stores stability, difficulty, due date, and last rating (1 through 4)
- Cards only appear in Due Today when their due date is today or earlier — never before
- New cards are introduced at a rate of 5 to 10 per day maximum — not all at once when a module is first created
- The daily card review budget caps at approximately 30 cards total across all journeys (about 15 minutes at 30 seconds per card)
- If the user skips a day and cards are overdue, the overdue stack is spread across the next 2 days — not dumped all at once
- The FSRS recomputation after each rating happens client-side using the stored card parameters — no API call needed

---

### 5. Journey Detail — Weekly Plan UI

Replace the current AI-generated prose paragraph on the journey detail page with two new UI elements:

**The weekly chip grid:**
- A Mon through Sun row of chips
- Each chip shows the module name abbreviation and an icon for the activity type assigned that day
- Tapping a chip shows a tooltip or drawer with the full assignment detail
- Days with only FSRS card reviews show a card icon with a count
- Rest days or caught-up days show a checkmark

**The module priority list beneath it:**
- Each active module gets one line of computed text based on its real data, not AI prose
- Stage A not started: "Start the learning guide — nothing else unlocks until it's complete"
- Stage A guide in progress: "Finish the learning guide, then your first quiz unlocks"
- Stage B accuracy above 75%: "On track — quiz [assigned days] this week"
- Stage B accuracy 50 to 75%: "Needs work — quiz [assigned days], focus on [weak concept tags]"
- Stage B accuracy below 50%: "Struggling — daily quiz this week, [weak concept] needs review"
- Stage C: "Mastery phase — [activity type] scheduled [assigned day]"

All of these strings are built from real module data. No AI generation. Weak concept tags come from session data already being tracked.

---

### 6. Home Page — Due Today Zone

Wire the home page Due Today zone to the new engine output:

- Replace the hardcoded COMPLETED_TODAY = 0 with real session data from today
- The Focus Now card at the top shows the single highest-priority item for today
- Below it, FSRS cards due today are shown as one combined deck entry (not individual cards)
- "Also today" collapsed section shows overflow items if budget is exceeded
- Caught-up state shows when there are genuinely no items due and no assigned activities remaining today
- The header shows the computed time estimate for today's plan

---

### 7. What Stays the Same

Do not touch any of the following:
- The FSRS rating UI (the 1-4 buttons after a card review)
- The actual study activity pages (quiz, guide, Feynman, free recall)
- The AI generation logic for learning guides and quizzes
- The journey creation flow
- Any existing data schemas beyond additive fields
- Routing

---

## Key Constraints

**No AI tokens for any of this.** Every calculation in the study plan engine, the weekly schedule, the module priority text, and the Due Today scope is pure JavaScript math and template strings. The only time Gemini gets called is when the user is actually doing a study activity (generating a quiz, a guide, etc.) — never for scheduling.

**Additive only on data.** Add fields to existing records where needed (weekly plan snapshot, FSRS card parameters) but never rename or remove existing fields. Anything that currently works must keep working.

**Performance.** The weekly plan is computed once and stored. React Query caches the read. Due Today reads from the stored plan — it does not recompute on every render or page load.

**Token efficiency is a non-negotiable design constraint for all future features too.** Any time you see a place where AI is being called for something that can be done with rules or math, flag it.

---

## What to Deliver

After reading this, produce:
1. A full technical task list broken into logical implementation chunks with dependencies noted
2. Any questions or gaps you see in this brief before writing any code
3. Your proposed order of implementation with reasoning

Do not start writing code until the task list is approved.
