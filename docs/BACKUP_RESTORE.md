# Backup and restore

## Creating a backup

Admins can create a full-fidelity backup from `/admin/blog` (**Platform backup**) or by invoking the `createPlatformBackup` function.

The response includes:

- `backupId`
- `schemaVersion` (currently `1`)
- `createdAt`, `createdBy`
- `entityCounts` per entity key
- `checksum` (SHA-256 hex of the full JSON payload)
- `byteLength`
- `status` (`ok` or `partial` if some entities were missing)
- `payload` (entities keyed by name)

A compact record is also stored on the `PlatformBackup` entity for freshness checks. Very large payloads may not fit inline; the downloadable response is authoritative.

## Integrity

Verify before trusting a file:

```js
const text = JSON.stringify(payloadFromFile.entities
  ? { /* reconstruct the same object shape used at backup time */ }
  : payloadFromFile);
// Prefer verifying against the checksum field returned with the backup.
```

In practice: keep the downloaded JSON intact and compare its recorded `checksum` against a recomputation of the exact `payload` object stringified the same way the server did (`JSON.stringify(payload)` where `payload` includes `schemaVersion`, `createdAt`, `createdBy`, `entityCounts`, `missing`, `entities`).

## Restoration outline

1. Provision a target environment with matching entity schemas (`BlogPost`, `BlogAsset`, `PlatformBackup`, existing study entities).
2. Disable user traffic.
3. Import entities in order, preserving IDs and foreign keys (`journeyId`, `moduleId`, `activityId`, `postId`, etc.).
4. Re-run `platformHealthCheck` and a blog publish smoke test.
5. Spot-check a sample of user journeys and one published blog post.

Restoration is a manual/admin operation today. Automated restore is intentionally out of scope until a migration project starts.

## Freshness monitoring

`platformHealthCheck` reports `checks.backupFresh` (true when the newest `PlatformBackup.createdAt` is within 7 days). Wire this into your cron or uptime monitor.

## What this is not

- Not a CSV analytics export (`exportAdminData` remains for research/admin tables).
- Not a Base44 replacement.
- Not a substitute for Base44 platform-level disaster recovery.
