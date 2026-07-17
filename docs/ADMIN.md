# Admin dashboard

Admin-only routes live under `/admin/*`. Legacy URLs redirect automatically.

## Routes

| Route | Purpose |
|-------|---------|
| `/admin/data` | Analytics dashboard: conversational queries, live stats, signup chart, CSV exports |
| `/admin/journeys` | List certified journeys |
| `/admin/journeys/new` | Create a new certified journey |
| `/admin/journeys/:journeyId` | Edit journey metadata, reorder modules, publish/unpublish |
| `/admin/journeys/:journeyId/modules/:moduleId` | Edit module content (guide, flashcards, question bank, concepts) |
| `/admin/errors` | Error monitoring dashboard |
| `/admin/research` | Research data exports and analytics |
| `/admin/blog` | Blog CMS list, migrate static posts, platform backup |
| `/admin/blog/:postId` | Edit blocks, preview, publish, archive, delete |

Legacy redirects: `/data` → `/admin/data`, `/errors` → `/admin/errors`, `/adminjourneys/*` → `/admin/journeys/*`.

## Certified journey workflow

1. Create a journey at `/admin/journeys/new`.
2. Add modules and set each module to **ready** after content is complete.
3. Use **Publish** on the journey editor — blocked until all modules are ready.
4. Publishing sets `isVeridianCertified`, `isPublic`, and `libraryVisible` via the `adminPublishCertifiedJourney` server function.

Email-based auto-certification was removed. Only admin-published journeys are certified.

## Server functions (publish in Base44)

- `getAdminAnalytics` — summary stats, signup trend, pattern-matched queries (rate-limited, audit-logged)
- `exportAdminData` — CSV exports: users, journeys, quizSessions, flashcardSessions, mastery, eventLog
- `adminPublishCertifiedJourney` — validate readiness, publish/unpublish certified journeys
- `listPublishedBlogPosts` / `getPublishedBlogPost` — anonymous-safe published blog reads
- `adminBlogPost` / `adminBlogAsset` — audited blog CMS mutations and media
- `migrateStaticBlogPosts` — idempotent static → CMS migration
- `createPlatformBackup` — full-fidelity JSON backup with checksums
- `platformHealthCheck` — synthetic health + backup freshness

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
