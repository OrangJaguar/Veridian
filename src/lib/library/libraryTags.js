export const LIBRARY_CATEGORIES = [
  { id: 'AP', label: 'AP' },
  { id: 'Pre-Med', label: 'Pre-Med' },
  { id: 'College', label: 'College' },
  { id: 'Self-Learning', label: 'Self-Learning' },
];

export const LIBRARY_TAGS = [
  'AP Chemistry',
  'AP Biology',
  'AP Physics',
  'AP Calculus',
  'AP History',
  'AP English',
  'MCAT',
  'Organic Chemistry',
  'Biochemistry',
  'Anatomy',
  'Calculus',
  'Statistics',
  'Computer Science',
  'Psychology',
  'Language',
  'Certification',
  'Professional',
];

/** Map tags to category for filter chips */
export const TAG_TO_CATEGORY = {
  'AP Chemistry': 'AP',
  'AP Biology': 'AP',
  'AP Physics': 'AP',
  'AP Calculus': 'AP',
  'AP History': 'AP',
  'AP English': 'AP',
  MCAT: 'Pre-Med',
  'Organic Chemistry': 'Pre-Med',
  Biochemistry: 'Pre-Med',
  Anatomy: 'Pre-Med',
  Calculus: 'College',
  Statistics: 'College',
  'Computer Science': 'College',
  Psychology: 'College',
  Language: 'Self-Learning',
  Certification: 'Self-Learning',
  Professional: 'Self-Learning',
};

export const MIN_MODULES_TO_PUBLISH = 3;
export const MIN_TAGS_TO_PUBLISH = 1;

export function getJourneyCategory(journey) {
  if (journey.libraryCategory) return journey.libraryCategory;
  const tags = journey.tags ?? [];
  for (const tag of tags) {
    if (TAG_TO_CATEGORY[tag]) return TAG_TO_CATEGORY[tag];
  }
  return null;
}

export function journeyMatchesCategory(journey, categoryId) {
  if (!categoryId || categoryId === 'all') return true;
  return getJourneyCategory(journey) === categoryId;
}

export function matchesLibrarySearch(journey, query) {
  if (!query?.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    journey.title?.toLowerCase().includes(q)
    || journey.subject?.toLowerCase().includes(q)
    || (journey.tags ?? []).some((t) => t.toLowerCase().includes(q))
    || (journey.creatorUsername ?? '').toLowerCase().includes(q)
  );
}

export function sortPublicJourneys(journeys, sortKey = 'cloned') {
  const list = [...journeys];
  if (sortKey === 'newest') {
    return list.sort((a, b) => (b.publishedAt ?? b.createdAt ?? 0) - (a.publishedAt ?? a.createdAt ?? 0));
  }
  return list.sort((a, b) => {
    const cc = (b.cloneCount ?? 0) - (a.cloneCount ?? 0);
    if (cc !== 0) return cc;
    return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
  });
}
