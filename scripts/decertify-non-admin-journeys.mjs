/**
 * One-time migration: clear isVeridianCertified on journeys not admin-published.
 * Run manually by an admin with Base44 credentials — not invoked by the app.
 *
 * Usage: node scripts/decertify-non-admin-journeys.mjs
 * Requires BASE44 credentials / SDK setup in your environment.
 */
console.log(`
Decertify non-admin journeys — run via Base44 dashboard or admin tooling.

See docs/ADMIN.md for the migration snippet:

  - Keep isVeridianCertified when isAdminAuthored && publishStatus === 'published'
  - Clear isVeridianCertified (and optionally isPublic) for all others
`);
