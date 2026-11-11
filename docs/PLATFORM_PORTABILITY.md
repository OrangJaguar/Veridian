# Platform portability and migration readiness

Veridian now runs on Vercel with Supabase Auth, Postgres, and Edge Functions. The UI still talks to provider-neutral adapters. `src/api/base44Client.js` is the Supabase implementation of the old entity and auth surface, kept so feature code did not have to be rewritten.

## Adapter boundaries

UI and feature code must depend on provider-neutral adapters under `src/api/adapters/`:

| Adapter | Responsibility |
|---------|----------------|
| `authAdapter` | Current user, admin check, sign-out |
| `functionAdapter` | Invoke backend functions by name |
| `blogAdapter` | Public and admin blog operations |
| `storageAdapter` | Blog media upload / list / delete |

Do **not** import `@/api/base44Client` from pages or presentational components. Entity helpers under `src/api/entities/` are the domain API. That module name is historical: it talks to Supabase, not Base44.

## Data mapping (high level)

| Domain concept | Stored as | Portable shape |
|----------------|--------------|----------------|
| Blog article | `BlogPost` entity | `{ postId, slug, status, blocks[], ... }` |
| Blog media | `BlogAsset` entity | `{ assetId, url, mimeType, altText, ... }` |
| Preferences | `UserPreferences` | Zod `preferencesSchema` |
| Study plan overrides | `PlanOverride` | Assignment-scoped override rows |
| Weekly commitments | `StudyCommitment` | Durable promised sessions |
| Full backup | `PlatformBackup` + download JSON | Versioned payload with checksums |

Blocks are JSON, validated by `src/utils/schemas/blog.js` on the client and `base44/functions/_shared/blogValidation.ts` on the server.

## Restore drills

1. Admin runs **Platform backup** from `/admin/blog` (or invokes `createPlatformBackup`).
2. Download the returned JSON; verify `checksum` and `entityCounts`.
3. Store the file offline (encrypted at rest if it contains user data).
4. Quarterly drill: restore a non-production environment from the JSON by re-creating entities in dependency order (preferences → journeys → modules → activities → cards → sessions → blog → overrides → commitments).
5. Record the drill date and any schema gaps in the ops log.

See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for the backup payload contract.

## Objective migration triggers

Consider a backend migration only when one or more of these are true:

- Base44 cannot meet required SLOs or data residency for 90 consecutive days after escalation.
- Storage or function cost exceeds a documented budget threshold for two consecutive quarters.
- Required capabilities (e.g. transactional multi-entity writes, fine-grained RLS) are unavailable and block a committed roadmap item.
- Vendor lock-in risk is accepted by stakeholders and a funded migration project exists.

The Base44 migration is in place. Adapters remain the boundary if the database moves again.

## Blog CMS admin

- List / create: `/admin/blog`
- Edit / preview / publish: `/admin/blog/:postId`
- Public reads: `listPublishedBlogPosts`, `getPublishedBlogPost` (published only)
- Static posts remain as fallback until migration parity passes (`Migrate static posts` on the admin list).
