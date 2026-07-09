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

async function sendEmail(base44: ReturnType<typeof createClientFromRequest>, to: string, subject: string, body: string) {
  const integrations = base44.integrations as { Core?: { SendEmail?: (p: { to: string; subject: string; body: string }) => Promise<unknown> } };
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

    for (const prefs of allPrefs) {
      const pref = prefs.notificationPref ?? "off";
      if (pref === "off" || !prefs.userEmail) continue;

      const lastSent = prefs.lastReminderEmailAt ?? 0;
      if (Date.now() - lastSent < SEVEN_DAYS_MS) continue;

      const journeys = await base44.entities.Journey.filter({
        userEmail: prefs.userEmail,
        archived: false,
      });
      const active = journeys.filter((j: { archived?: boolean }) => !j.archived);
      if (active.length === 0) continue;

      let shouldSend = false;
      let subject = "Your Veridian study reminder";
      let body = "You have active journeys waiting. Open Veridian to see what's due today: https://veridianstudy.base44.app/home";

      if (pref === "daily") {
        shouldSend = true;
      } else if (pref === "urgent") {
        const urgentJourney = active.find((j: { examDate?: number }) => {
          const until = daysUntilExam(j.examDate ?? 0);
          return until != null && until > 0 && until <= THREE_DAYS_MS;
        });
        if (urgentJourney) {
          const key = `${urgentJourney.journeyId}:${urgentJourney.examDate}`;
          const sentFor: string[] = prefs.examReminderSentFor ?? [];
          if (!sentFor.includes(key)) {
            shouldSend = true;
            const safeTitle = sanitizeEmailText(urgentJourney.title) || "Your journey";
            subject = `Exam coming up: ${safeTitle}`;
            body = `Your exam for "${safeTitle}" is within 3 days. Review your plan: https://veridianstudy.base44.app/journeys/${urgentJourney.journeyId}`;
            await base44.entities.UserPreferences.update(prefs.id, {
              examReminderSentFor: [...sentFor, key],
            });
          }
        }
      }

      if (!shouldSend) continue;

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