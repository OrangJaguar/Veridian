# Veridian

A study platform for students — deck library, quiz mode, flashcard learn sessions, and telemetry. Built on Base44 + Vite + React.

## Run locally

1. Clone the repository
2. `npm install`
3. Create `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://veridianstudy.base44.app
```

4. `npm run dev`

### Gemini API (Journey creation — server-side only)

Never put `GEMINI_API_KEY` in `.env.local` or any `VITE_*` variable.

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Copy [`.env.secrets.example`](.env.secrets.example) to `.env.secrets` and add your key
3. Push the secret to Base44:

```bash
base44 secrets set --env-file .env.secrets
```

Backend function [`functions/geminiJourney/entry.ts`](functions/geminiJourney/entry.ts) reads `GEMINI_API_KEY` via `Deno.env.get()`.

## App Editor vs Backend Platform (read this)

Veridian was created in the **Base44 App Editor** (`veridianstudy.base44.app`, custom domain `veridian.study`). That is different from a **Backend Platform** project created with `base44 create`.

| Your workflow | Works? |
|---------------|--------|
| Push to GitHub → **Publish** in dashboard | Frontend + functions synced from repo |
| `npx base44 functions deploy` | **No** — CLI deploy only works on Backend Platform apps |
| `npx base44 entities push` | **No** — same restriction |
| `npx base44 deploy` | **No** — same restriction |

If CLI says *"This endpoint is only available for Backend Platform apps"*, that is expected for App Editor apps. Use GitHub + Publish, or create the function in **Dashboard → Code → Functions**.

### Deploy the AI backend function

Function layout (required):

```
functions/geminiJourney/
  function.jsonc
  entry.ts
```

1. Confirm `GEMINI_API_KEY` is set: `base44 secrets list`
2. Push this repo to GitHub (includes `functions/geminiJourney/`)
3. In Base44 dashboard, click **Publish**
4. Verify **Dashboard → Code → Functions** — `geminiJourney` should appear as Deployed/Active
5. If still missing after publish, open **Code → Functions**, create `geminiJourney`, and paste `functions/geminiJourney/entry.ts`

### Fix RLS security warnings (App Editor)

Entity schemas with RLS live in [`base44/entities/`](base44/entities/). Rules use `data.userEmail` matching `{{user.email}}` — the pattern the security scanner expects.

**Publish does not always sync permission rules to live tables.** After pushing entity changes:

1. **Dashboard → Security → Run Security Scan**
2. For each **Data permission gap**, expand it and click **Fix** (review each table — do not blindly Fix All)
3. Or manually: **Dashboard → Data → [table] → Permissions → Edit** → Entity-User Field Comparison: `userEmail` = user `email` for Create, Read, Update, Delete

Tables: Journey, Module, Activity, Card, Session, UserAiQuota, UserDeck, UserPreferences, UserTelemetry.

## Publish

Open [Base44.com](http://Base44.com) and click Publish after pushing to GitHub.

## Docs

- [Base44 GitHub integration](https://docs.base44.com/developers/app-code/local-development/github)
- [Base44 support](https://app.base44.com/support)
