import { createClientFromRequest } from "npm:@base44/sdk@0.8.31";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function daysUntilExam(examDate: number) {
  if (!examDate) return null;
  return examDate - Date.now();
}

/** Strip HTML tags, control characters, and limit length to prevent email spoofing. */
function sanitizeEmailText(raw: unknown, max = 120): string {
  return String(raw ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, max);
}

/** Normalize legacy notificationPref: daily → weekly. */
function normalizePref(value: unknown): "weekly" | "urgent" | "off" {
  if (value === "daily" || value === "weekly") return "weekly";
  if (value === "urgent") return "urgent";
  return "off";
}

function localHourInTimezone(timeZone: string, now = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(now);
    const hour = parts.find((p) => p.type === "hour")?.value;
    return Number(hour) || 0;
  } catch {
    return now.getUTCHours();
  }
}

function localDateKey(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

type ReminderTriggers = {
  commitment?: boolean;
  dueWork?: boolean;
  exam?: boolean;
  unfinished?: boolean;
};

function triggerEnabled(triggers: ReminderTriggers | undefined, key: keyof ReminderTriggers): boolean {
  if (!triggers) return true;
  return triggers[key] !== false;
}

async function sendEmail(
  base44: ReturnType<typeof createClientFromRequest>,
  to: string,
  subject: string,
  body: string,
) {
  const integrations = base44.integrations as {
    Core?: { SendEmail?: (p: { to: string; subject: string; body: string }) => Promise<unknown> };
  };
  if (integrations?.Core?.SendEmail) {
    await integrations.Core.SendEmail({ to, subject, body });
    return true;
  }
  console.log("[studyReminderEmail] would send", { to, subject });
  return false;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");
    const isCron = cronSecret && headerSecret === cronSecret;

    if (!isCron) {
      return Response.json({ error: { message: "Cron only" } }, { status: 403 });
    }

    const allPrefs = await base44.entities.UserPreferences.list();
    let sent = 0;
    const dedupeKeys = new Set<string>();

    for (const prefs of allPrefs) {
      const pref = normalizePref(prefs.notificationPref);
      if (pref === "off" || !prefs.userEmail) continue;

      const lastSent = prefs.lastReminderEmailAt ?? 0;
      if (Date.now() - lastSent < SEVEN_DAYS_MS) continue;

      const timeZone = prefs.timezone || "UTC";
      const localHour = localHourInTimezone(timeZone);
      const preferredHour = typeof prefs.reminderLocalHour === "number"
        ? prefs.reminderLocalHour
        : 9;
      // Send in a 2-hour window around preferred local hour
      if (Math.abs(localHour - preferredHour) > 1 && !(preferredHour === 0 && localHour >= 23)) {
        continue;
      }

      const triggers = (prefs.reminderTriggers ?? {}) as ReminderTriggers;
      const todayKey = localDateKey(timeZone);

      const journeys = await base44.entities.Journey.filter({
        userEmail: prefs.userEmail,
        archived: false,
      });
      const active = journeys.filter((j: { archived?: boolean }) => !j.archived);
      if (active.length === 0) continue;

      let shouldSend = false;
      let subject = "Your Veridian study reminder";
      let body =
        "You have active journeys waiting. Open Veridian to see what's due today: https://veridianstudy.base44.app/home";
      let reasonKey = "generic";

      if (pref === "weekly") {
        // Opt-in trigger checks (default on when unset)
        let reasonFound = false;

        if (triggerEnabled(triggers, "commitment")) {
          try {
            const commitments = await base44.entities.StudyCommitment.filter({
              userEmail: prefs.userEmail,
            });
            const openToday = commitments.filter((c: {
              status?: string;
              scheduledDateKey?: string;
            }) => (
              (c.status === "planned" || c.status === "started")
              && c.scheduledDateKey === todayKey
            ));
            if (openToday.length > 0) {
              reasonFound = true;
              reasonKey = `commitment:${todayKey}`;
              subject = "Your study commitment for today";
              body =
                `You committed to ${openToday.length} session${openToday.length === 1 ? "" : "s"} today. Open Veridian: https://veridianstudy.base44.app/home`;
            }
          } catch {
            // entity may not exist yet in older envs
          }
        }

        if (!reasonFound && triggerEnabled(triggers, "dueWork")) {
          const snap = prefs.globalPlanSnapshot as {
            days?: Array<{ dateKey?: string; assignments?: unknown[] }>;
          } | undefined;
          const todayDay = snap?.days?.find((d) => d.dateKey === todayKey);
          if ((todayDay?.assignments?.length ?? 0) > 0) {
            reasonFound = true;
            reasonKey = `due:${todayKey}`;
            subject = "You have study work due today";
            body =
              "Your Due Today list has work waiting. Open Veridian: https://veridianstudy.base44.app/home";
          }
        }

        if (!reasonFound && triggerEnabled(triggers, "unfinished")) {
          try {
            const sessions = await base44.entities.Session.filter({
              userEmail: prefs.userEmail,
              status: "in_progress",
            });
            if (sessions.length > 0) {
              reasonFound = true;
              reasonKey = `unfinished:${todayKey}`;
              subject = "You have an unfinished study session";
              body =
                "Pick up where you left off: https://veridianstudy.base44.app/home";
            }
          } catch {
            // best effort
          }
        }

        if (!reasonFound && triggerEnabled(triggers, "exam")) {
          const urgentJourney = active.find((j: { examDate?: number }) => {
            const until = daysUntilExam(j.examDate ?? 0);
            return until != null && until > 0 && until <= THREE_DAYS_MS;
          });
          if (urgentJourney) {
            reasonFound = true;
            reasonKey = `exam:${urgentJourney.journeyId}:${urgentJourney.examDate}`;
            const safeTitle = sanitizeEmailText(urgentJourney.title) || "Your journey";
            subject = `Exam coming up: ${safeTitle}`;
            body =
              `Your exam for "${safeTitle}" is within 3 days. Review your plan: https://veridianstudy.base44.app/journeys/${urgentJourney.journeyId}`;
          }
        }

        // Fall back: weekly nudge only if user enabled weekly and has active journeys
        // but no specific trigger matched — still send a gentle nudge once/week
        if (!reasonFound) {
          reasonFound = true;
          reasonKey = `weekly:${prefs.userEmail}:${todayKey.slice(0, 7)}`;
        }

        shouldSend = reasonFound;
      } else if (pref === "urgent") {
        if (!triggerEnabled(triggers, "exam")) continue;
        const urgentJourney = active.find((j: { examDate?: number }) => {
          const until = daysUntilExam(j.examDate ?? 0);
          return until != null && until > 0 && until <= THREE_DAYS_MS;
        });
        if (urgentJourney) {
          const key = `${urgentJourney.journeyId}:${urgentJourney.examDate}`;
          const sentFor: string[] = prefs.examReminderSentFor ?? [];
          if (!sentFor.includes(key)) {
            shouldSend = true;
            reasonKey = `exam-urgent:${key}`;
            const safeTitle = sanitizeEmailText(urgentJourney.title) || "Your journey";
            subject = `Exam coming up: ${safeTitle}`;
            body =
              `Your exam for "${safeTitle}" is within 3 days. Review your plan: https://veridianstudy.base44.app/journeys/${urgentJourney.journeyId}`;
            await base44.entities.UserPreferences.update(prefs.id, {
              examReminderSentFor: [...sentFor, key],
            });
          }
        }
      }

      if (!shouldSend) continue;

      const dedupe = `${prefs.userEmail}|${reasonKey}`;
      if (dedupeKeys.has(dedupe)) continue;
      dedupeKeys.add(dedupe);

      const didSend = await sendEmail(base44, prefs.userEmail, subject, body);
      if (didSend || !base44.integrations) {
        await base44.entities.UserPreferences.update(prefs.id, {
          lastReminderEmailAt: Date.now(),
        });
        sent += 1;
      }
    }

    return Response.json({ ok: true, sent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reminder job failed";
    return Response.json({ error: { message } }, { status: 500 });
  }
});
