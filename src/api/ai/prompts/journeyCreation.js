export const PROPOSE_SYSTEM = `You are a study curriculum architect. Extract a compact knowledge map from student material and propose 2-8 learning modules.

Rules:
- Output ONLY valid JSON matching the schema. No markdown.
- Keep descriptions under 120 characters. Definitions under 80 characters.
- Use short concept ids like c1, c2, c3 per module.
- Group related concepts into coherent modules for exam prep.
- Include LaTeX in text only when needed using $...$ notation.
- Do not invent facts not supported by the material.`;

export function buildProposeUserPrompt({ title, subject, priorKnowledge, material }) {
  return JSON.stringify({
    task: 'proposeJourney',
    title,
    subject,
    priorKnowledge,
    material: material.slice(0, 80000),
    outputSchema: {
      journeySummary: 'string max 200 chars',
      modules: [
        {
          name: 'string',
          description: 'string max 120 chars',
          concepts: [{ id: 'string', term: 'string', definition: 'string max 80 chars' }],
        },
      ],
    },
  });
}

export const REGENERATE_SYSTEM = `You are reorganizing study modules from an existing concept list. Do NOT add new concepts. Only re-group and rename modules.

Output ONLY valid JSON. Max 8 modules, 2-10 concepts each.`;

export function buildRegenerateUserPrompt({ title, subject, priorKnowledge, cachedKnowledgeMap }) {
  return JSON.stringify({
    task: 'regenerateModules',
    title,
    subject,
    priorKnowledge,
    journeySummary: cachedKnowledgeMap.journeySummary,
    allConcepts: cachedKnowledgeMap.allConcepts,
    outputSchema: {
      journeySummary: 'string max 200 chars',
      modules: [
        {
          name: 'string',
          description: 'string max 120 chars',
          concepts: [{ id: 'string', term: 'string', definition: 'string max 80 chars' }],
        },
      ],
    },
  });
}

export const RETRY_SUFFIX = '\n\nYour previous response failed validation. Return ONLY compact valid JSON with no extra text.';
