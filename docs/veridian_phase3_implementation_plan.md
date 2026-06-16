# Phase 3 — Settings, Profile & Auth Recovery

**Depends on:** Phase 0 (auth, username, legal, onboarding), Phase 2 (library `creatorUsername` sync)  
**Goal:** Full Settings and Profile pages, forgot/reset password via Base44 SDK, preference editors wired to `UserPreferences`, credit-conscious email reminders, and self-serve account deletion.

**Exit criteria:** Sign in → change password in Settings; sign out; toggle theme/haptics; edit research consent and notification pref; change username (6-month cooldown); delete account removes app data; forgot-password flow works; Profile shows learner context + stats without session history.

---

## v1 scope (locked)

| Include | Skip for v1 |
|---------|-------------|
| Settings: username + email (no display name) | `displayName` entity removal |
| Change password (`base44.auth.changePassword`) | Google OAuth |
| Forgot + reset password (`resetPasswordRequest` / `resetPassword`) | Email address change |
| Theme, haptics, audio, strict mode, daily budget | Push notifications |
| Notification pref + minimal email cron | Marketing emails |
| Research consent edit + telemetry gate | Full Learning Profile analytics |
| Journey defaults (`defaultPrivacy`, `defaultShowSources`) | Per-journey library controls (Phase 2) |
| Sign out + delete account function | Session history on Profile |
| Profile: learner context + aggregate stats | Knowledge map / trends (Phase 10) |

---

## Entity changes

### `UserPreferences` ([`base44/entities/UserPreferences.jsonc`](../base44/entities/UserPreferences.jsonc))

| Field | Type | Purpose |
|-------|------|---------|
| `usernameChangedAt` | number | Last username change (6-month cooldown) |
| `lastReminderEmailAt` | number | Rate-limit reminder emails |
| `examReminderSentFor` | string[] | `journeyId:examDate` keys for urgent reminders |

Zod mirror: [`src/utils/schemas/preferences.js`](../src/utils/schemas/preferences.js)

**Default change:** `notificationPref` for new signups → `'off'` (was `'urgent'`) in [`src/api/entities/preferences.js`](../src/api/entities/preferences.js).

---

## Auth recovery

### API — [`src/api/auth/password.js`](../src/api/auth/password.js)

| Function | SDK |
|----------|-----|
| `requestPasswordReset(email)` | `base44.auth.resetPasswordRequest` |
| `completePasswordReset({ resetToken, newPassword })` | `base44.auth.resetPassword` |
| `changePassword({ userId, currentPassword, newPassword })` | `base44.auth.changePassword` |

### Routes

| Path | Component |
|------|-----------|
| `/forgot-password` | [`ForgotPasswordPage.jsx`](../src/pages/auth/ForgotPasswordPage.jsx) |
| `/reset-password?reset_token=` | [`ResetPasswordPage.jsx`](../src/pages/auth/ResetPasswordPage.jsx) |

- Login tab links to forgot password in [`AuthForm.jsx`](../src/components/auth/AuthForm.jsx).
- Forgot flow uses neutral success copy (no account enumeration).
- Configure Base44 auth redirect URL → production `/reset-password`.

---

## Settings page

**Route:** `/settings` → [`SettingsPage.jsx`](../src/pages/settings/SettingsPage.jsx)

| Section | Component | Behavior |
|---------|-----------|----------|
| Account | `SettingsAccountSection` | Email (read-only), username editor, change password, sign out |
| Appearance | `SettingsAppearanceSection` | Dark mode toggle → `themeDark` + localStorage |
| Study defaults | `SettingsStudySection` | Budget, strict mode, haptics, audio |
| Journey defaults | `SettingsJourneyDefaultsSection` | `defaultPrivacy`, `defaultShowSources` |
| Notifications | `SettingsNotificationsSection` | `off` / `daily` / `urgent` radio |
| Research | `SettingsResearchSection` | `researchConsent` toggle |
| Danger zone | `SettingsDangerSection` + `DeleteAccountModal` | Type DELETE → invoke function |
| Legal | footer links | Privacy, Terms |

### Username change — [`src/api/entities/username.js`](../src/api/entities/username.js)

- Cooldown: `USERNAME_CHANGE_COOLDOWN_MS` = 6 × 30 days
- Validates format + `checkUsernameAvailable`
- Updates `username` + `usernameChangedAt`
- Syncs `creatorUsername` on public journeys via `syncCreatorUsernameOnJourneys` in [`library.js`](../src/api/entities/library.js)

### Theme sync

- [`src/lib/theme.js`](../src/lib/theme.js): `persistThemeToStorage`, `applyThemeFromPreferences`
- [`ThemeSync.jsx`](../src/components/ThemeSync.jsx) in [`AppShell`](../src/layouts/AppShell.jsx)

### Study feedback prefs

- [`feedback.js`](../src/utils/study/feedback.js): `setStudyFeedbackPrefs` / gates on `haptics` and `audio`
- [`QuizSetupModal`](../src/components/study/quiz/QuizSetupModal.jsx) default strict mode from preferences via [`PracticeQuizStartButton`](../src/components/study/quiz/PracticeQuizStartButton.jsx)

---

## Profile page

**Route:** `/profile` → [`ProfilePage.jsx`](../src/pages/profile/ProfilePage.jsx)

| Block | Component |
|-------|-----------|
| Identity | `@username`, email, member since — username change link to Settings |
| Study overview | [`ProfileStatsCard`](../src/components/profile/ProfileStatsCard.jsx) |
| Learner context | [`LearnerContextForm`](../src/components/profile/LearnerContextForm.jsx) |

**Stats API** — [`profileStats.js`](../src/api/entities/profileStats.js): active journeys, total study time, review sessions, completed sessions.

**Explicitly excluded:** session history (lives on module detail via `SessionHistoryPanel`).

---

## Research telemetry gate

[`useCompleteSession.js`](../src/hooks/study/useCompleteSession.js) and [`useAbandonSession.js`](../src/hooks/study/useAbandonSession.js) only attach `buildSessionResearchFields` output when `preferences.researchConsent === true`.

---

## Base44 functions

### `deleteUserAccount`

- Path: [`base44/functions/deleteUserAccount/`](../base44/functions/deleteUserAccount/)
- Authenticated user deletes all rows with matching `userEmail` in order: Session → Card → Activity → Module → Journey → UserDeck → UserAiQuota → UserTelemetry → UserPreferences
- Client: [`src/api/account/deleteAccount.js`](../src/api/account/deleteAccount.js) → `base44.functions.invoke('deleteUserAccount')`
- Auth user record may persist until manual Base44 cleanup (documented in Settings)

### `studyReminderEmail`

- Path: [`base44/functions/studyReminderEmail/`](../base44/functions/studyReminderEmail/)
- Cron-only (`x-cron-secret` header)
- Rules:
  - Skip `notificationPref === 'off'`
  - Max 1 email per user per 7 days (`lastReminderEmailAt`)
  - `daily`: weekly nudge if active journeys exist
  - `urgent`: exam within 3 days, once per `journeyId:examDate`
- Uses `integrations.Core.SendEmail` when available; logs otherwise

---

## Hooks

| Hook | File |
|------|------|
| `useUpdatePreferences` | existing |
| `useChangePassword` | [`useChangePassword.js`](../src/hooks/mutations/useChangePassword.js) |
| `useChangeUsername` | [`useChangeUsername.js`](../src/hooks/mutations/useChangeUsername.js) |
| `useDeleteAccount` | [`useDeleteAccount.js`](../src/hooks/mutations/useDeleteAccount.js) |
| `useProfileStats` | [`useProfileStats.js`](../src/hooks/queries/useProfileStats.js) |

Query key: `queryKeys.profile.stats`

---

## Testing checklist

- [ ] Settings shows email + username (no display name)
- [ ] Change password with wrong current password errors
- [ ] Forgot password → reset link → new password → sign in
- [ ] Username change respects 6-month cooldown; syncs public `creatorUsername`
- [ ] Theme persists across refresh
- [ ] Haptics/audio off silences study feedback
- [ ] Research consent off omits session telemetry fields
- [ ] Notification pref saves without immediate email
- [ ] Delete account removes data and signs out
- [ ] Profile stats render; no session history list
- [ ] `npm run build` passes

---

## Base44 publish checklist

1. Publish `UserPreferences.jsonc` field additions
2. Deploy `deleteUserAccount` — Security Scan
3. Deploy `studyReminderEmail` + weekly cron + `CRON_SECRET`
4. Set password reset redirect URL to `/reset-password`
5. Enable email integration only if credits acceptable

---

## Deferred beyond Phase 3

- Google OAuth
- Push / in-app notification center
- Full Learning Profile (knowledge map, trends)
- Email address change
- `displayName` migration removal
- JourneyGridZone on Home
