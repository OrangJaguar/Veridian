# Veridian Admin Guide

Admin-only surfaces are hidden from navigation. Access requires `role: admin` on the user account in Base44.

## Assigning admin role

1. Open the [Base44 dashboard](https://base44.com) for this project.
2. Go to **Authentication → Users**.
3. Select the team account and set **role** to `admin`.
4. Save. The user must sign out and back in for the role to apply.

Non-admin users hitting admin routes are redirected to `/home` by `RequireAdmin`.

## Admin routes

| Route | Purpose |
|-------|---------|
| `/data` | Analytics dashboard: conversational queries, live stats, signup chart, CSV exports |
| `/adminjourneys` | List certified journeys |
| `/adminjourneys/new` | Create a new certified journey |
| `/adminjourneys/:journeyId` | Edit journey metadata, reorder modules, publish/unpublish |
| `/adminjourneys/:journeyId/modules/:moduleId` | Edit module content (guide, flashcards, question bank, concepts) |
| `/errors` | Error monitoring dashboard (existing) |

## Publishing certified journeys

1. Create a journey at `/adminjourneys/new`.
2. Add modules and set each module to **ready** after content is complete.
3. Use **Publish** on the journey editor — blocked until all modules are ready.
4. Publishing sets `isVeridianCertified`, `isPublic`, and `libraryVisible` via the `adminPublishCertifiedJourney` server function.

Email-based auto-certification was removed. Only admin-published journeys are certified.

## Server functions (publish in Base44)

- `getAdminAnalytics` — summary stats, signup trend, pattern-matched queries (rate-limited, audit-logged)
- `exportAdminData` — CSV exports: users, journeys, quizSessions, flashcardSessions, mastery, eventLog
- `adminPublishCertifiedJourney` — validate readiness, publish/unpublish certified journeys

After prompt changes, also republish `geminiStudy` (AP Style question generation).

## One-time migration: decertify non-admin journeys

Journeys that were certified via the old email-based rule should be decertified unless they were published through the admin CMS (`isAdminAuthored === true` and `publishStatus === 'published'`).

Run once from the Base44 dashboard or a trusted admin script:

```js
const journeys = await base44.entities.Journey.list();
for (const j of journeys) {
  if (!j.isVeridianCertified) continue;
  if (j.isAdminAuthored && j.publishStatus === 'published') continue;
  await base44.entities.Journey.update(j.id, {
    isVeridianCertified: false,
    isPublic: j.isAdminAuthored ? j.isPublic : false,
  });
}
```

Review results before running in production.

## Entity schema updates

Ensure these fields exist in the Base44 dashboard:

- **Journey:** `publishStatus`, `examType`, `difficultyLevel`, `shortDescription`, `longDescription`, `targetAudience`, `estimatedStudyHours`, `coverColor`, `coverImageUrl`, `isAdminAuthored`
- **Module:** `moduleStatus`, `estimatedStudyMinutes`
- **AdminAuditLog:** admin-only entity for export/query audit trail
