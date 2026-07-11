/**
 * Reference prompts for generateLearningGuide — canonical server copy: base44/functions/aiStudy/entry.ts
 * UI layout (LearningGuideViewer):
 *   title → zigzag explanation (+ 2 decorative SVG slots, client-side) → worked example →
 *   check-in → YouTube chips (client-side from title) → Continue
 */

export const LEARNING_GUIDE_SYSTEM = `You are an expert study guide writer for Veridian, a learning app.

Your job is to produce JSON for a sectioned learning guide. The explanation text is the PRIMARY teaching surface — write thoroughly in plain language. Side panels beside the text show keyTerms and takeaways (you generate these — NOT images).

Rules:
- Output ONLY valid JSON matching the schema. No markdown fences.
- Use $...$ inline and $$...$$ block for math when needed.
- Assume the reader is a motivated beginner unless priorKnowledge says otherwise.
- Teach from the provided module concepts only — do not invent facts outside the knowledge map.
- Each section must stand alone as a coherent lesson.

EXPLANATION (most important — this is the main content):
- 80–120 words per section, 2 short paragraphs separated by \\n\\n.
- Write full sentences (the UI splits on . ! ? for a zigzag layout).
- Define key terms inline on first use; use analogies and concrete examples in prose.

SIDE PANELS (beside explanation in zigzag layout):
- keyTerms: 2–3 { term, definition } — critical terms/formulas/rules from THIS section only.
- takeaways: 2 short strings — what to remember after reading (exam-relevant).

WORKED EXAMPLE (exactly one per section in workedExamples array):
- scenario: a specific, realistic problem stated clearly (1–2 sentences).
- steps: 3–4 ordered steps that walk through the solution; each step one clear action.
- answer: the final result or conclusion in plain language.
- reasoning: 1–2 sentences tying the example back to the section concepts.

CHECK-IN (one multipleChoice per section):
- type: "multipleChoice" with exactly 4 options.
- The correct answer MUST be clearly supported by the section explanation and worked example.
- Distractors should reflect plausible misconceptions, not joke answers.
- Include a brief explanation for why the correct answer is right.

Do NOT include narrationText — the app reads the on-screen text aloud.`;

export function sectionCountForConcepts(concepts = []) {
  const n = concepts.length;
  if (n <= 3) return 3;
  if (n <= 6) return 4;
  return Math.min(5, Math.ceil(n / 2));
}

const PRIOR_KNOWLEDGE_DEPTH = {
  scratch: 'Assume zero prior exposure. Define every term. Use simple analogies. Avoid jargon without explanation.',
  some: 'Assume basic familiarity with the subject. Define module-specific terms. Connect to intuitions the student may already have.',
  most: 'Assume solid subject background. Focus on nuance, distinctions, and exam-relevant applications. Still define module-specific terms briefly.',
};

export function depthGuidanceForPriorKnowledge(priorKnowledge) {
  return PRIOR_KNOWLEDGE_DEPTH[priorKnowledge] ?? PRIOR_KNOWLEDGE_DEPTH.some;
}

export function buildLearningGuideUserPrompt({
  moduleName,
  moduleDescription,
  concepts = [],
  subject,
  priorKnowledge = 'some',
  sectionCount,
}) {
  const sections = sectionCount ?? sectionCountForConcepts(concepts);

  return JSON.stringify({
    task: 'generateLearningGuide',
    subject,
    moduleName,
    moduleDescription,
    priorKnowledge,
    depthGuidance: depthGuidanceForPriorKnowledge(priorKnowledge),
    targetSectionCount: sections,
    concepts,
    layoutNotes: {
      explanationRole: 'Primary teaching content in a zigzag layout with keyTerms and takeaways panels on the sides.',
      keyTermsCount: '2-3 per section',
      takeawaysCount: '2 per section',
      workedExamplesCount: 1,
      checkInType: 'multipleChoice with exactly 4 options',
    },
    outputSchema: {
      sections: [
        {
          sectionId: 'short-kebab-case slug',
          title: 'string — section heading',
          explanation: 'string — 80-120 words, paragraphs separated by \\n\\n',
          keyTerms: [{ term: 'string', definition: 'string — 1-2 sentences' }],
          takeaways: ['string — short bullet takeaway'],
          workedExamples: [{
            scenario: 'string — the problem',
            steps: ['string — step 1', 'string — step 2', '...3-4 steps'],
            answer: 'string — what we found',
            reasoning: 'string — why this works and what to take away',
          }],
          checkInQuestion: {
            question: 'string',
            type: 'multipleChoice',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'string — must match one option exactly',
            explanation: 'string',
          },
        },
      ],
      totalSections: 'number — must equal sections.length',
      estimatedMinutes: 'number — realistic reading time (e.g. 12-25)',
    },
  });
}

export const LEARNING_GUIDE_RETRY_SUFFIX =
  '\n\nYour previous response failed validation. Return ONLY compact valid JSON. Each section needs explanation, workedExamples as an array with one object (not "workedExample"), and checkIn with 4 options.';