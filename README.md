# Veridian

A personalized study system that tells you exactly what to study each day.

## What it is

Veridian is a study app that builds personalized learning plans from your own material. It breaks content into structured phases, uses spaced repetition and active recall techniques, and adjusts what you see each day based on your mastery.

## Core Features

- Journey-based learning with structured phases (Learn → Practice → Mastery)
- AI-generated learning guides and practice quizzes
- Spaced repetition flashcard system (FSRS)
- Feynman Technique and Free Recall study modes
- Synthesis questions across modules
- Daily study recommendations based on mastery data
- Exam countdown and study pacing

## Tech Stack

- **React** + **Vite** — frontend UI and build tooling
- **Base44** — auth, data storage, and app infrastructure
- **TanStack Query** — server state and caching
- **Google Gemini API** — AI-generated learning guides, quizzes, and study feedback (server-side)

## Getting Started

1. Clone the repository
2. `npm install`
3. Copy [`.env.example`](.env.example) to `.env.local` and fill in your Base44 app credentials
4. `npm run dev`

For AI features (journey creation), set `GEMINI_API_KEY` server-side via Base44 secrets — never in `.env.local` or any `VITE_*` variable.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BASE44_APP_ID` | Yes | Your Base44 app ID for the Veridian project |
| `VITE_BASE44_APP_BASE_URL` | Yes | Base URL of your Base44 app (e.g. `https://veridianstudy.base44.app`) |
| `GEMINI_API_KEY` | For AI | Google Gemini API key — set via Base44 secrets, not in the frontend |

## Project Structure

| Path | Purpose |
|------|---------|
| `src/pages` | Route-level screens — home, journeys, study modes, auth, legal, onboarding |
| `src/components` | Reusable UI — study sessions, journey creation, layout, shared widgets |
| `src/hooks` | React hooks — queries, mutations, study session logic, auth helpers |
| `src/api` | Base44 entity clients, AI calls, and data access layer |
| `src/utils` | Pure helpers — FSRS, study planner, schemas, normalization |

## Status

v1 in active development. **Phase 3** (Settings, Profile, forgot-password) is implemented in this repo.

### Phase 3 exit criteria

- Settings: username, email, change password, theme, study prefs, notifications, research consent, sign out, delete account
- Profile: learner context + aggregate stats (no session history)
- Forgot / reset password via Base44 SDK (`/forgot-password`, `/reset-password?reset_token=...`)

Configure your Base44 app auth redirect URL so password reset emails land on `/reset-password`. Deploy `deleteUserAccount` and `studyReminderEmail` functions from `base44/functions/`.

## License

MIT
