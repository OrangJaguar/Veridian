# Veridian

**Full-stack learning platform that builds personalized study plans from a student's notes and exam dates, diagnoses exactly why they are getting questions wrong across six failure modes, and serves targeted practice each day using an ever-growing concept knowledge map.**

Live at [veridian.study](https://veridian.study) · Currently in closed beta

---

## The Problem

Most students don't fail because they aren't capable. They fail because they study 
the wrong things, study passively, and have no real feedback loop between effort 
and outcome until a grade comes back. By then, it's too late to change anything.

Every one of these failures is solvable with known learning science:
- **Spaced repetition** solves the timing problem
- **Active recall** solves the method problem
- **Source-grounded AI question generation** solves the material alignment problem
- **Knowledge gap detection** solves the feedback problem

Veridian implements all four, integrated into a single system that requires no 
prior knowledge of how to study effectively.

---

## How It Works

### Journeys
A Journey is the core unit — one per subject or exam. You create one by uploading 
your source material: class notes, a textbook chapter, a PDF, or raw pasted text. 
Veridian extracts the knowledge structure inside and builds a personalized study 
plan calibrated to your exam deadline.

### Modules
Inside each Journey are Modules — individual concept units extracted automatically 
from your source material. Each Module has its own mastery state, FSRS review 
schedule, and stage placement tracked independently.

### Three-Stage Learning System

Every Module moves through three stages. Stage placement is determined by the 
diagnostic — not a fixed schedule.

**Stage A — Learn**  
For first exposure. A structured Learning Guide breaks the concept into sections 
with plain-language explanations, worked examples for quantitative subjects, and 
embedded check-in questions you have to answer before moving forward. Full LaTeX 
rendering throughout for math, chemistry, physics, and economics.

**Stage B — Practice**  
For retrieval and reinforcement. AI-generated questions built from your actual 
source material — novel every session, never repeating. Multiple question types 
(multiple choice, short answer, worked problems, synthesis) with difficulty 
adjusting to your recent performance. If you keep missing the same concept, 
Veridian surfaces a targeted review before continuing.

**Stage C — Mastery**  
For verification. Free recall, Feynman-style prompts, and synthesis questions 
with no hints or scaffolding. You either know it or you don't.

### The Diagnostic
When you start a new Journey, Veridian runs a short adaptive diagnostic across 
all modules before placing you anywhere. Each module gets an individual stage 
placement and an initial FSRS stability estimate. If you already understand half 
the material, you skip Stage A on those modules and start in Stage B. The 
diagnostic also seeds your Knowledge Map — the personal mastery record that grows 
with every session.

### FSRS Scheduling
Veridian uses FSRS (Free Spaced Repetition Scheduler) — the most accurate spaced 
repetition algorithm available, significantly more precise than the SM-2 algorithm 
Anki uses. FSRS models memory as a function of stability and retrievability and 
computes optimal review intervals for long-term retention. In Veridian, FSRS is 
additionally calibrated to your exam deadline — backfilling from that date so 
mastery arrives at the right moment, not six months later.

### Cram Mode
Available at any time regardless of FSRS schedule. Surfaces the highest-risk 
material — lowest retention, least time until the exam — and runs an intensive 
session against it. Designed for the 48 hours before an exam when normal review 
intervals no longer apply.

### Community Library
Students can publish a completed Journey so others can clone it, plug in their 
own deadline, and use it as their own. You share the structure — personal 
learning data never transfers. The library grows as students share what worked.

### Learning Profile
Every session feeds a persistent Learning Profile: a global Knowledge Map with 
mastery state per module, a Subject Breakdown with trends per subject, a full 
Study History log, and an FSRS Health Summary that surfaces plain signals — 
stable, needs attention, or at risk. All profile data is private regardless of 
what you publish.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Backend | Base44 |
| AI | Google Gemma |
| Scheduling | FSRS |
| Math Rendering | KaTeX |
| Privacy Mode | WebGPU (on-device inference) |

---

## Running Locally

```bash
git clone https://github.com/OrangJaguar/Veridian.git
cd Veridian
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

Required environment variables are documented in `.env.example`.

---

## Free Forever

Every feature in Veridian is available to every student, permanently. No premium 
tier, no Pro plan, no paywall. The students who need this most are often the ones 
who can least afford another subscription.

---

## License

This project is licensed under the **Business Source License 1.1 (BUSL-1.1)**.

You may view, fork, and run this code for **personal and non-commercial use only**. 
Commercial use, hosting as a competing service, or redistribution without 
permission is not permitted under this license.

The license automatically converts to **MIT** on **January 1, 2028**.

See [`LICENSE`](./LICENSE) for the full terms.

---

Built by [Sanskar Gupta](https://github.com/OrangJaguar)
