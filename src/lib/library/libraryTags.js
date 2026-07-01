export const LIBRARY_CATEGORIES = [
  { id: 'AP', label: 'AP' },
  { id: 'Pre-Med', label: 'Pre-Med' },
  { id: 'College', label: 'College' },
  { id: 'Self-Learning', label: 'Self-Learning' },
];

export const LIBRARY_TAGS = [
  'AP',
  'SAT',
  'ACT',
  'MCAT',
  'GRE',
  'LSAT',
  'Nursing',
  'Pre-Med',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Statistics',
  'Computer Science',
  'Psychology',
  'History',
  'English',
  'Economics',
  'Business',
  'Engineering',
  'Organic Chemistry',
  'Biochemistry',
  'Anatomy',
  'Calculus',
  'Language',
  'Foreign Language',
  'Certification',
  'Professional',
  'Self-Learning',
  'Other',
];

/** Map tags to category for filter chips */
export const TAG_TO_CATEGORY = {
  AP: 'AP',
  SAT: 'AP',
  ACT: 'AP',
  MCAT: 'Pre-Med',
  GRE: 'Pre-Med',
  LSAT: 'Pre-Med',
  Nursing: 'Pre-Med',
  'Pre-Med': 'Pre-Med',
  'Organic Chemistry': 'Pre-Med',
  Biochemistry: 'Pre-Med',
  Anatomy: 'Pre-Med',
  Biology: 'College',
  Chemistry: 'College',
  Physics: 'College',
  Calculus: 'College',
  Statistics: 'College',
  'Computer Science': 'College',
  Psychology: 'College',
  History: 'College',
  English: 'College',
  Economics: 'College',
  Business: 'College',
  Engineering: 'College',
  Mathematics: 'College',
  Language: 'Self-Learning',
  'Foreign Language': 'Self-Learning',
  Certification: 'Self-Learning',
  Professional: 'Self-Learning',
  'Self-Learning': 'Self-Learning',
  Other: 'Self-Learning',
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
  const certified = journeys.filter((j) => j.isVeridianCertified);
  const community = journeys.filter((j) => !j.isVeridianCertified);

  function sortList(list) {
    const copy = [...list];
    if (sortKey === 'newest') {
      return copy.sort((a, b) => (b.publishedAt ?? b.createdAt ?? 0) - (a.publishedAt ?? a.createdAt ?? 0));
    }
    return copy.sort((a, b) => {
      const cc = (b.cloneCount ?? 0) - (a.cloneCount ?? 0);
      if (cc !== 0) return cc;
      return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
    });
  }

  return [...sortList(certified), ...sortList(community)];
}
