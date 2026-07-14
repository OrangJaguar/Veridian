/**
 * Prefer a Veridian-certified public journey for the sample onboarding path.
 * Falls back to any featured/public journey, then null.
 */
export function getSampleLibraryJourney(journeys = []) {
  const list = Array.isArray(journeys) ? journeys.filter(Boolean) : [];
  if (!list.length) return null;

  const certified = list.find((j) => j.isVeridianCertified || j.isCertified);
  if (certified) return certified;

  const featured = list.find((j) => j.isFeatured || j.featured);
  if (featured) return featured;

  return list[0] ?? null;
}

export function getSampleLibraryJourneyHref(journeys = []) {
  const sample = getSampleLibraryJourney(journeys);
  if (!sample?.journeyId) return '/library';
  return `/library/${sample.journeyId}`;
}
