/**
 * Find the most recent completed journey challenge before the current session.
 */
export function getPreviousChallengeSession(sessions, currentSessionId) {
  return sessions
    .filter((s) =>
      s.activityType === 'journeyChallenge'
      && s.status === 'completed'
      && s.sessionId !== currentSessionId,
    )
    .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0] ?? null;
}

/**
 * Per-module accuracy deltas vs previous challenge.
 * @returns {{ moduleId, name, delta, current, previous }[]}
 */
export function computeChallengeDeltas(modules, currentAccuracy, previousSession) {
  const prev = previousSession?.sessionData?.perModuleAccuracy ?? {};
  return modules
    .map((m) => {
      const current = currentAccuracy[m.moduleId];
      const previous = prev[m.moduleId];
      if (current == null || previous == null) return null;
      return {
        moduleId: m.moduleId,
        name: m.name,
        delta: current - previous,
        current,
        previous,
      };
    })
    .filter(Boolean)
    .filter((d) => d.delta !== 0);
}
