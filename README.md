# Veridian

A study platform for students — deck library, quiz mode, flashcard learn sessions, and telemetry. Built on Base44 + Vite + React.

## Run locally

1. Clone the repository
2. `npm install`
3. Create `.env.local`:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
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

Backend function [`base44/functions/geminiJourney/entry.ts`](base44/functions/geminiJourney/entry.ts) reads `GEMINI_API_KEY` via `Deno.env.get()`.

### Frontend vs backend on Base44 (important)

| Action | What it deploys |
|--------|-----------------|
| **Publish** (dashboard) | Frontend only — your Vite `dist/` site |
| **`npx base44 functions deploy`** | Backend functions only — `base44/functions/*/entry.ts` |
| **`npx base44 deploy`** | Everything (entities, functions, site) |

**Publish alone does NOT deploy backend functions.** That is why you see 404 on `geminiJourney`.

### Deploy the AI backend function (one-time + after function changes)

1. Set secret: `base44 secrets set GEMINI_API_KEY=your_key` (or `--env-file .env.secrets`)
2. Publish entity schemas (`UserAiQuota`, etc.) on Base44
3. Deploy the function from project root:
   ```bash
   npx base44 functions deploy geminiJourney
   ```
4. Verify in Base44 Dashboard → **Code → Functions** — `geminiJourney` should show **Deployed/Active**
5. Publish frontend (dashboard) for any UI changes

Function layout (required by Base44):
```
base44/functions/geminiJourney/
  function.jsonc
  entry.ts
```

## Publish

Open [Base44.com](http://Base44.com) and click Publish.

After adding or changing entity schemas in `base44/entities/`, publish before testing Journey API hooks in the app.

## Docs

- [Base44 GitHub integration](https://docs.base44.com/Integrations/Using-GitHub)
- [Base44 support](https://app.base44.com/support)
