# Veridian error monitoring

Brief ops guide for the Base44-backed error monitoring system.

## Components

| Piece | Location |
|-------|----------|
| Entities | `ErrorGroup`, `ErrorOccurrence` |
| Log function | `logAppError` |
| Admin API | `getErrorDashboard` (admin-only) |
| Admin UI | `/errors` (requires `role === 'admin'`) |
| Client capture | `ErrorBoundary`, `GlobalErrorHandlers`, `logClientError` |
| Server capture | `logServerError` in `geminiStudy` / `geminiJourney` catch blocks |

## Base44 publish checklist

1. Publish entities: `ErrorGroup.jsonc`, `ErrorOccurrence.jsonc`, `FeedbackSubmission.jsonc`
2. Deploy functions: `logAppError`, `getErrorDashboard`, `submitFeedback`
3. Redeploy `geminiStudy` and `geminiJourney` (server error logging)
4. Set secrets:
   - `ADMIN_ALERT_EMAIL=support.veridian@gmail.com`
   - Optional: `ERROR_ALERT_THRESHOLDS=1,10,50`
5. Enable email integration in Base44 (same as study reminders)
6. Set your Base44 user `role` to `admin` in the dashboard

## Alert behavior

- Email sent on **new error group** (first occurrence)
- Email sent when occurrence count crosses thresholds (default 1, 10, 50) not yet in `alertThresholdsSent`
- Duplicate occurrences do **not** trigger repeat emails
- Rate limit: max 30 reports per fingerprint per hour (in-memory in function)

## Admin dashboard

- Route: `/errors`
- Filters: status, environment, source
- Click a row to open detail panel with stack sample and recent occurrences
- Status actions: open, resolved, ignored

## Feedback

- Route: `/feedback` (multi-step wizard)
- Function: `submitFeedback` with 5/hour rate limit
- Optional email notification to `ADMIN_ALERT_EMAIL`

## Testing

1. Throw a test error in dev console → appears in `/errors` as admin
2. Same error twice → one group, count increments, no second email
3. Non-admin redirected from `/errors`
4. Submit feedback via `/feedback` wizard
