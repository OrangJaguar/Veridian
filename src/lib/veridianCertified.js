export function isVeridianCertifiedJourney(journey) {
  return journey?.isVeridianCertified === true;
}

export function certifiedAuthorLabel(journey) {
  if (isVeridianCertifiedJourney(journey)) return 'Made by Veridian';
  if (journey?.creatorUsername) return `@${journey.creatorUsername}`;
  return null;
}

export function cloneLineageLabel(journey) {
  if (!journey?.clonedFromVeridianCertified) return null;
  const title = journey.clonedFromTitle ?? 'journey';
  return `Based on Veridian's ${title}`;
}
