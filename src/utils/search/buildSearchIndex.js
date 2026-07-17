/**
 * Build a flat searchable index from journeys, modules, and cards.
 * Each item has { id, type, text, label, sublabel, href, journeyId, moduleId? }.
 */
export function buildSearchIndex({ journeys = [], modules = [], cards = [] }) {
  const journeyById = {};
  for (const j of journeys) journeyById[j.journeyId] = j;

  const moduleById = {};
  for (const m of modules) moduleById[m.moduleId] = m;

  const items = [];

  for (const j of journeys) {
    items.push({
      id: `j-${j.journeyId}`,
      type: 'journey',
      text: `${j.title ?? ''} ${j.subject ?? ''}`.toLowerCase(),
      label: j.title || j.journeyId,
      sublabel: j.subject || '',
      href: `/journeys/${j.journeyId}`,
      journeyId: j.journeyId,
    });
  }

  for (const m of modules) {
    const journey = journeyById[m.journeyId];
    items.push({
      id: `m-${m.moduleId}`,
      type: 'module',
      text: `${m.name ?? ''} ${m.description ?? ''}`.toLowerCase(),
      label: m.name || m.moduleId,
      sublabel: journey?.title || '',
      href: `/journeys/${m.journeyId}/modules/${m.moduleId}`,
      journeyId: m.journeyId,
      moduleId: m.moduleId,
    });
  }

  for (const c of cards) {
    const journey = journeyById[c.journeyId];
    items.push({
      id: `c-${c.cardId}`,
      type: 'card',
      text: `${c.front ?? ''} ${c.back ?? ''}`.toLowerCase(),
      label: c.front || '',
      sublabel: journey?.title || '',
      href: `/journeys/${c.journeyId}`,
      journeyId: c.journeyId,
      cardId: c.cardId,
    });
  }

  return items;
}
